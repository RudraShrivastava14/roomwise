import { atPropertyTime, EARLY_CHECKIN, nightsBetween, STANDARD_CHECKIN } from './time';

export const EARLY_CHECKIN_FEE = 1000;

/** A guest booking for today can't physically arrive the moment they click "book". */
export const SAME_DAY_TRAVEL_MINUTES = 60;

export function quote(pricePerNight: number, checkIn: string, checkOut: string, isEarlyCheckIn: boolean) {
  const nights = nightsBetween(checkIn, checkOut);
  const earlyCheckInFee = isEarlyCheckIn ? EARLY_CHECKIN_FEE : 0;
  return { nights, earlyCheckInFee, totalPrice: pricePerNight * nights + earlyCheckInFee };
}

/**
 * When housekeeping should expect the guest: 12:00 with early check-in,
 * 14:00 otherwise. Same-day bookings made after that time get an ETA of
 * now + travel time instead of a time that has already passed.
 */
export function expectedArrival(checkIn: string, isEarlyCheckIn: boolean, now: Date = new Date()): string {
  const scheduled = atPropertyTime(checkIn, isEarlyCheckIn ? EARLY_CHECKIN : STANDARD_CHECKIN);
  const earliest = new Date(now.getTime() + SAME_DAY_TRAVEL_MINUTES * 60_000);
  return new Date(scheduled) < earliest ? earliest.toISOString() : scheduled;
}
