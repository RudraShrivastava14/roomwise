import 'server-only';
import { CleaningStatus, DamageReport, HousekeepingTask, NotificationLog, QueueItem, Room } from '../types';
import { RoomDoc } from '../seed';
import { buildQueue } from '../priority';
import { collections, fromDoc, getDb, logNotification } from './db';
import { HttpError } from './http';

/** The only forward moves a housekeeper can make. */
const NEXT_STATUS: Record<CleaningStatus, CleaningStatus | null> = {
  DIRTY: 'CLEANING',
  CLEANING: 'INSPECTION',
  INSPECTION: 'READY',
  READY: null,
};

export interface StaffSnapshot {
  rooms: Room[];
  queue: QueueItem[];
  notifications: NotificationLog[];
  generatedAt: string;
}

export async function staffSnapshot(now = new Date()): Promise<StaffSnapshot> {
  const db = await getDb();
  const { rooms, tasks, notifications } = collections(db);
  const [roomDocs, taskDocs, notifDocs] = await Promise.all([
    rooms.find().sort({ floor: -1, roomNumber: 1 }).toArray(),
    tasks.find().toArray(),
    notifications.find().sort({ timestamp: -1 }).limit(30).toArray(),
  ]);
  return {
    rooms: roomDocs.map(d => ({ ...fromDoc<RoomDoc>(d), isBooked: false })),
    queue: buildQueue(taskDocs.map(d => fromDoc<HousekeepingTask>(d)), now),
    notifications: notifDocs.map(d => fromDoc<NotificationLog>(d)),
    generatedAt: now.toISOString(),
  };
}

export async function advanceTask(taskId: string, to: CleaningStatus, actor: string, now = new Date()): Promise<void> {
  const db = await getDb();
  const { tasks, rooms } = collections(db);

  const task = await tasks.findOne({ _id: taskId });
  if (!task) throw new HttpError(404, 'Task not found');

  const from = task.status;
  if (NEXT_STATUS[from] !== to) {
    throw new HttpError(409, `Room ${task.roomNumber} is ${from}; it can't move to ${to}. Refresh to see the latest state.`);
  }

  // Conditional on the status we read, so two housekeepers tapping at once can't skip a step.
  const res = await tasks.updateOne(
    { _id: taskId, status: from },
    {
      $set: {
        status: to,
        updatedAt: now.toISOString(),
        // Whoever starts the clean owns the room; later steps keep that owner.
        assignedStaff: to === 'CLEANING' ? actor : task.assignedStaff ?? actor,
      },
    }
  );
  if (res.modifiedCount === 0) {
    throw new HttpError(409, `Room ${task.roomNumber} was just updated by someone else. Refresh to see the latest state.`);
  }
  await rooms.updateOne({ _id: task.roomId }, { $set: { status: to } });

  if (to === 'READY') {
    await logNotification(db, {
      type: 'WHATSAPP',
      recipient: 'Front desk',
      message: `Room ${task.roomNumber} is inspected and READY${task.nextGuestName ? ` for ${task.nextGuestName}` : ''} (marked by ${actor}).`,
    });
  }
}

export async function reportDamage(taskId: string, report: Omit<DamageReport, 'reportedAt'>, now = new Date()) {
  const db = await getDb();
  const { tasks } = collections(db);
  const damageReport: DamageReport = { ...report, reportedAt: now.toISOString() };
  const res = await tasks.findOneAndUpdate({ _id: taskId }, { $set: { damageReport, updatedAt: now.toISOString() } });
  if (!res) throw new HttpError(404, 'Task not found');

  await logNotification(db, {
    type: 'SMS',
    recipient: 'Maintenance',
    message: `Room ${res.roomNumber}: ${report.severity.toLowerCase()} damage reported — ${report.item}.`,
  });
}
