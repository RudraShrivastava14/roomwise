import { describe, expect, it } from 'vitest';
import { atPropertyTime, nightsBetween, propertyDate, stayNights } from './time';

describe('time helpers', () => {
  it('uses IST for the property date', () => {
    // 20:00 UTC on the 26th is already the 27th in India.
    expect(propertyDate(new Date('2026-09-26T20:00:00Z'))).toBe('2026-09-27');
  });

  it('converts property-local times to UTC instants', () => {
    expect(atPropertyTime('2026-09-27', '14:00')).toBe('2026-09-27T08:30:00.000Z');
  });

  it('counts nights with checkout exclusive, across month ends', () => {
    expect(nightsBetween('2026-09-29', '2026-10-02')).toBe(3);
    expect(stayNights('2026-09-29', '2026-10-02')).toEqual(['2026-09-29', '2026-09-30', '2026-10-01']);
  });
});
