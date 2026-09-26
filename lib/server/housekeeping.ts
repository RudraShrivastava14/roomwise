import 'server-only';
import { CleaningStatus, DamageReport, HousekeepingTask, NotificationLog, QueueItem, Room, StaffSession } from '../types';
import { RoomDoc } from '../seed';
import { buildQueue } from '../priority';
import { formatPropertyTime } from '../time';
import { collections, fromDoc, getDb, logNotification } from './db';
import { StaffUserDoc } from './password';
import { HttpError } from './http';

/**
 * Who may move a room from one status to the next. The admin plans and
 * inspects; the assigned housekeeper cleans. Nobody else can move it.
 */
const TRANSITIONS: { from: CleaningStatus; to: CleaningStatus; by: 'assignee' | 'admin' }[] = [
  { from: 'DIRTY', to: 'CLEANING', by: 'assignee' }, // start cleaning
  { from: 'CLEANING', to: 'INSPECTION', by: 'assignee' }, // cleaning done
  { from: 'INSPECTION', to: 'READY', by: 'admin' }, // approve: guest may enter
  { from: 'INSPECTION', to: 'CLEANING', by: 'admin' }, // send back for re-clean
];

export interface StaffSnapshot {
  rooms: Room[];
  queue: QueueItem[];
  notifications: NotificationLog[];
  generatedAt: string;
}

/** Admin sees every room and every message; a housekeeper sees only their rooms and their inbox. */
export async function staffSnapshot(session: StaffSession, now = new Date()): Promise<StaffSnapshot> {
  const db = await getDb();
  const { rooms, tasks, notifications } = collections(db);
  const isAdmin = session.role === 'admin';
  const [roomDocs, taskDocs, notifDocs] = await Promise.all([
    rooms.find().sort({ floor: -1, roomNumber: 1 }).toArray(),
    tasks.find(isAdmin ? {} : { assignedTo: session.username }).toArray(),
    notifications
      .find(isAdmin ? {} : { to: session.username })
      .sort({ timestamp: -1 })
      .limit(30)
      .toArray(),
  ]);
  return {
    rooms: roomDocs.map(d => ({ ...fromDoc<RoomDoc>(d), isBooked: false })),
    queue: buildQueue(taskDocs.map(d => fromDoc<HousekeepingTask>(d)), now),
    notifications: notifDocs.map(d => fromDoc<NotificationLog>(d)),
    generatedAt: now.toISOString(),
  };
}

/** Admin hands a room that needs cleaning to a housekeeper (or moves it to someone else). */
export async function assignTask(taskId: string, username: string, now = new Date()): Promise<void> {
  const db = await getDb();
  const { tasks } = collections(db);

  const user = await db.collection<StaffUserDoc>('staff_users').findOne({ _id: username });
  if (!user) throw new HttpError(404, 'No such staff member');

  const task = await tasks.findOne({ _id: taskId });
  if (!task) throw new HttpError(404, 'Task not found');

  // Only rooms nobody has started yet can be (re)assigned.
  const res = await tasks.updateOne(
    { _id: taskId, status: 'DIRTY' },
    { $set: { assignedTo: user._id, assignedStaff: user.displayName, updatedAt: now.toISOString() } }
  );
  if (res.matchedCount === 0) {
    throw new HttpError(409, `Room ${task.roomNumber} is already ${task.status.toLowerCase()}; it can't be reassigned now.`);
  }

  const [item] = buildQueue([{ ...fromDoc<HousekeepingTask>(task), assignedTo: user._id }], now);
  await logNotification(db, {
    type: 'WHATSAPP',
    to: user._id,
    recipient: user.displayName,
    message: `Room ${task.roomNumber} assigned to you by Admin. ${
      task.nextArrivalAt ? `Next guest arrives ${formatPropertyTime(task.nextArrivalAt)} — ${item.priority} priority.` : 'No guest booked in yet.'
    }`,
  });
}

export async function advanceTask(taskId: string, to: CleaningStatus, actor: StaffSession, now = new Date()): Promise<void> {
  const db = await getDb();
  const { tasks, rooms } = collections(db);

  const task = await tasks.findOne({ _id: taskId });
  if (!task) throw new HttpError(404, 'Task not found');

  const from = task.status;
  const rule = TRANSITIONS.find(t => t.from === from && t.to === to);
  if (!rule) {
    throw new HttpError(409, `Room ${task.roomNumber} is ${from}; it can't move to ${to}. Refresh to see the latest state.`);
  }
  if (rule.by === 'admin' && actor.role !== 'admin') {
    throw new HttpError(403, 'Only the admin can approve or send back a room.');
  }
  if (rule.by === 'assignee' && task.assignedTo !== actor.username) {
    throw new HttpError(
      403,
      actor.role === 'admin'
        ? 'Assign this room to a housekeeper; they start and finish the cleaning.'
        : `Room ${task.roomNumber} isn't assigned to you.`
    );
  }

  // Conditional on the status we read, so two taps at once can't skip a step.
  const res = await tasks.updateOne({ _id: taskId, status: from }, { $set: { status: to, updatedAt: now.toISOString() } });
  if (res.modifiedCount === 0) {
    throw new HttpError(409, `Room ${task.roomNumber} was just updated by someone else. Refresh to see the latest state.`);
  }
  await rooms.updateOne({ _id: task.roomId }, { $set: { status: to } });

  const who = task.assignedStaff ?? 'Housekeeper';
  const assignee = task.assignedTo ?? 'admin';
  if (from === 'DIRTY' && to === 'CLEANING') {
    await logNotification(db, { type: 'WHATSAPP', to: 'admin', recipient: 'Admin', message: `Room ${task.roomNumber}: ${who} started cleaning.` });
  } else if (to === 'INSPECTION') {
    await logNotification(db, {
      type: 'WHATSAPP',
      to: 'admin',
      recipient: 'Admin',
      message: `Room ${task.roomNumber}: ${who} finished cleaning. Please inspect and approve.`,
    });
  } else if (to === 'READY') {
    await logNotification(db, {
      type: 'WHATSAPP',
      to: assignee,
      recipient: who,
      message: `Room ${task.roomNumber} passed inspection. Thanks!`,
    });
    await logNotification(db, {
      type: 'WHATSAPP',
      to: 'frontdesk',
      recipient: 'Front desk',
      message: `Room ${task.roomNumber} is approved and READY${task.nextGuestName ? ` for ${task.nextGuestName}` : ''}. Guest may check in.`,
    });
  } else if (from === 'INSPECTION' && to === 'CLEANING') {
    await logNotification(db, {
      type: 'WHATSAPP',
      to: assignee,
      recipient: who,
      message: `Room ${task.roomNumber} sent back by Admin — please re-clean and mark done again.`,
    });
  }
}

export async function reportDamage(taskId: string, report: Omit<DamageReport, 'reportedAt'>, actor: StaffSession, now = new Date()) {
  const db = await getDb();
  const { tasks } = collections(db);
  const damageReport: DamageReport = { ...report, reportedAt: now.toISOString() };
  const res = await tasks.findOneAndUpdate({ _id: taskId }, { $set: { damageReport, updatedAt: now.toISOString() } });
  if (!res) throw new HttpError(404, 'Task not found');

  await logNotification(db, {
    type: 'WHATSAPP',
    to: 'admin',
    recipient: 'Admin',
    message: `Room ${res.roomNumber}: ${actor.displayName} reported ${report.severity.toLowerCase()} damage — ${report.item}.`,
  });
}
