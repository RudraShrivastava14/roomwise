import { describe, expect, it } from 'vitest';
import { expectedArrival, quote } from './booking-rules';
import { bookingSchema, requestCodeSchema, verifyCodeSchema } from './validation';

describe('quote', () => {
  it('charges per night plus the early check-in fee', () => {
    expect(quote(5000, '2026-09-27', '2026-09-29', true)).toEqual({ nights: 2, earlyCheckInFee: 1000, totalPrice: 11000 });
  });
});

describe('expectedArrival', () => {
  it('uses 14:00 IST normally and 12:00 IST with early check-in', () => {
    const morning = new Date('2026-09-27T02:30:00Z'); // 08:00 IST
    expect(expectedArrival('2026-09-27', false, morning)).toBe('2026-09-27T08:30:00.000Z');
    expect(expectedArrival('2026-09-27', true, morning)).toBe('2026-09-27T06:30:00.000Z');
  });

  it('never schedules a same-day arrival in the past', () => {
    const evening = new Date('2026-09-27T13:30:00Z'); // 19:00 IST
    expect(expectedArrival('2026-09-27', false, evening)).toBe('2026-09-27T14:30:00.000Z');
  });
});

describe('bookingSchema', () => {
  const schema = bookingSchema('2026-09-26');
  const valid = {
    roomId: 'room_403',
    checkIn: '2026-09-26',
    checkOut: '2026-09-28',
    isEarlyCheckIn: false,
  };

  it('accepts a valid booking', () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ['past check-in', { checkIn: '2026-09-25' }],
    ['checkout before check-in', { checkOut: '2026-09-26' }],
    ['stay too long', { checkOut: '2026-11-30' }],
    ['injected room id', { roomId: '{"$ne":null}' }],
  ])('rejects %s', (_label, patch) => {
    expect(schema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});

describe('guest sign-in schemas', () => {
  it('normalises email and accepts the demo address', () => {
    expect(requestCodeSchema.parse({ email: ' Ananya@Example.com ' }).email).toBe('ananya@example.com');
    expect(requestCodeSchema.safeParse({ email: 'guest@demo.roomwise' }).success).toBe(true);
  });

  it('rejects bad emails and non 6-digit codes', () => {
    expect(requestCodeSchema.safeParse({ email: 'nope' }).success).toBe(false);
    expect(verifyCodeSchema.safeParse({ email: 'a@b.co', code: '12345' }).success).toBe(false);
    expect(verifyCodeSchema.safeParse({ email: 'a@b.co', code: '12a456' }).success).toBe(false);
    expect(verifyCodeSchema.safeParse({ email: 'a@b.co', code: '012345' }).success).toBe(true);
  });
});
