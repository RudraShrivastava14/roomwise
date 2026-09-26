import { describe, expect, it } from 'vitest';
import { buildQueue, bufferMinutes, priorityFor, remainingWorkMinutes, INSPECTION_MINUTES } from './priority';
import { HousekeepingTask } from './types';

const NOW = new Date('2026-09-26T06:00:00.000Z'); // 11:30 IST
const inMin = (m: number) => new Date(NOW.getTime() + m * 60_000).toISOString();

function task(overrides: Partial<HousekeepingTask>): HousekeepingTask {
  return {
    id: 't',
    roomId: 'r',
    roomNumber: '401',
    floor: 4,
    category: 'Deluxe Room',
    status: 'DIRTY',
    checkoutAt: inMin(-30),
    nextArrivalAt: inMin(180),
    nextGuestName: 'Guest',
    isEarlyCheckIn: false,
    cleaningEstMinutes: 35,
    assignedTo: null,
    assignedStaff: null,
    notes: null,
    damageReport: null,
    updatedAt: NOW.toISOString(),
    ...overrides,
  };
}

describe('bufferMinutes', () => {
  it('subtracts cleaning + inspection from time until arrival', () => {
    expect(bufferMinutes(task({}), NOW)).toBe(180 - 35 - INSPECTION_MINUTES);
  });

  it('cannot start work before the previous guest checks out', () => {
    // Guest leaves in 60 min, next arrives in 120: only 60 min window.
    const t = task({ checkoutAt: inMin(60), nextArrivalAt: inMin(120) });
    expect(bufferMinutes(t, NOW)).toBe(60 - 35 - INSPECTION_MINUTES);
  });

  it('goes negative when the room will be late', () => {
    expect(bufferMinutes(task({ nextArrivalAt: inMin(20) }), NOW)).toBeLessThan(0);
  });

  it('is null when no guest is arriving', () => {
    expect(bufferMinutes(task({ nextArrivalAt: null }), NOW)).toBeNull();
  });

  it('credits time already spent cleaning', () => {
    const t = task({ status: 'CLEANING', updatedAt: inMin(-20) });
    expect(remainingWorkMinutes(t, NOW)).toBe(35 - 20 + INSPECTION_MINUTES);
  });
});

describe('priorityFor', () => {
  it('maps slack to labels', () => {
    expect(priorityFor('DIRTY', -10)).toBe('URGENT');
    expect(priorityFor('DIRTY', 30)).toBe('URGENT');
    expect(priorityFor('DIRTY', 60)).toBe('HIGH');
    expect(priorityFor('DIRTY', 200)).toBe('NORMAL');
    expect(priorityFor('DIRTY', null)).toBe('LOW');
    expect(priorityFor('READY', -10)).toBe('LOW');
  });
});

describe('buildQueue', () => {
  it('orders by least slack, then no-arrival rooms, then ready rooms', () => {
    const queue = buildQueue(
      [
        task({ id: 'ready', status: 'READY' }),
        task({ id: 'relaxed', nextArrivalAt: inMin(300) }),
        task({ id: 'noGuest', nextArrivalAt: null }),
        task({ id: 'tight', nextArrivalAt: inMin(60) }),
      ],
      NOW
    );
    expect(queue.map(q => q.id)).toEqual(['tight', 'relaxed', 'noGuest', 'ready']);
    expect(queue[0].priority).toBe('URGENT');
  });

  it('reproduces the brief: 402 outranks 403 despite checking out earlier', () => {
    // 403: checkout 11:00, arrival 14:00, 35 min. 402: checkout 10:30, arrival 13:00, 40 min.
    const at = (hhmm: string) => new Date(`2026-09-26T${hhmm}:00+05:30`).toISOString();
    const early = new Date(at('10:00'));
    const queue = buildQueue(
      [
        task({ id: '403', roomNumber: '403', checkoutAt: at('11:00'), nextArrivalAt: at('14:00'), cleaningEstMinutes: 35 }),
        task({ id: '402', roomNumber: '402', checkoutAt: at('10:30'), nextArrivalAt: at('13:00'), cleaningEstMinutes: 40 }),
      ],
      early
    );
    expect(queue[0].id).toBe('402');
  });
});
