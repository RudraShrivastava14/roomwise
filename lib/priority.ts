import { HousekeepingTask, PriorityLevel, QueueItem } from './types';

/** Minutes a supervisor needs to inspect a room after cleaning. */
export const INSPECTION_MINUTES = 10;

/** Buffer thresholds (minutes) that map slack time to a priority label. */
export const URGENT_BUFFER_MAX = 30;
export const HIGH_BUFFER_MAX = 90;

const MS_PER_MIN = 60_000;

/**
 * Minutes of work left before the room can be handed to the next guest.
 * A room mid-clean only owes the part of its estimate that hasn't elapsed yet
 * (never less than 5 min, since estimates are optimistic).
 */
export function remainingWorkMinutes(task: HousekeepingTask, now: Date): number {
  switch (task.status) {
    case 'READY':
      return 0;
    case 'INSPECTION':
      return INSPECTION_MINUTES;
    case 'CLEANING': {
      const elapsed = (now.getTime() - new Date(task.updatedAt).getTime()) / MS_PER_MIN;
      return Math.max(task.cleaningEstMinutes - elapsed, 5) + INSPECTION_MINUTES;
    }
    case 'DIRTY':
      return task.cleaningEstMinutes + INSPECTION_MINUTES;
  }
}

/**
 * Slack time before the next guest arrives:
 *   buffer = nextArrival − max(now, checkout) − remainingWork
 * Work cannot start before the previous guest checks out, hence the max().
 * Negative means the room will not be ready in time. Null means no arrival is scheduled.
 */
export function bufferMinutes(task: HousekeepingTask, now: Date): number | null {
  if (!task.nextArrivalAt) return null;
  const arrival = new Date(task.nextArrivalAt).getTime();
  const checkout = task.checkoutAt ? new Date(task.checkoutAt).getTime() : now.getTime();
  const workStart = Math.max(now.getTime(), checkout);
  return Math.round((arrival - workStart) / MS_PER_MIN - remainingWorkMinutes(task, now));
}

export function priorityFor(status: HousekeepingTask['status'], buffer: number | null): PriorityLevel {
  if (status === 'READY' || buffer === null) return 'LOW';
  if (buffer <= URGENT_BUFFER_MAX) return 'URGENT';
  if (buffer <= HIGH_BUFFER_MAX) return 'HIGH';
  return 'NORMAL';
}

/**
 * Builds the housekeeping queue: open tasks with the least slack first,
 * then open tasks with no incoming guest, then rooms already READY.
 */
export function buildQueue(tasks: HousekeepingTask[], now: Date = new Date()): QueueItem[] {
  const items: QueueItem[] = tasks.map(task => {
    const buffer = bufferMinutes(task, now);
    return {
      ...task,
      bufferMinutes: buffer,
      remainingWorkMinutes: Math.round(remainingWorkMinutes(task, now)),
      priority: priorityFor(task.status, buffer),
    };
  });

  const rank = (i: QueueItem) => (i.status === 'READY' ? 2 : i.bufferMinutes === null ? 1 : 0);

  return items.sort(
    (a, b) =>
      rank(a) - rank(b) ||
      (a.bufferMinutes ?? 0) - (b.bufferMinutes ?? 0) ||
      a.roomNumber.localeCompare(b.roomNumber)
  );
}
