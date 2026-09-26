/**
 * The demo property is in India, so "today" and standard check-in/out times
 * are always evaluated in IST regardless of where the server runs.
 */
export const PROPERTY_TZ_OFFSET = '+05:30';
export const STANDARD_CHECKIN = '14:00';
export const EARLY_CHECKIN = '12:00';
export const STANDARD_CHECKOUT = '11:00';

const MS_PER_DAY = 86_400_000;

/** YYYY-MM-DD for the given instant, in the property's timezone. */
export function propertyDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
}

/** ISO instant for a property-local date + HH:mm. */
export function atPropertyTime(date: string, hhmm: string): string {
  return new Date(`${date}T${hhmm}:00${PROPERTY_TZ_OFFSET}`).toISOString();
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  return new Date(d.getTime() + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Nights between two YYYY-MM-DD dates (checkout exclusive). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round(
    (new Date(`${checkOut}T00:00:00Z`).getTime() - new Date(`${checkIn}T00:00:00Z`).getTime()) / MS_PER_DAY
  );
}

/** Every night of a stay, e.g. 26th→28th gives [26th, 27th]. */
export function stayNights(checkIn: string, checkOut: string): string[] {
  return Array.from({ length: nightsBetween(checkIn, checkOut) }, (_, i) => addDays(checkIn, i));
}

/** "2:05 PM" in property time, for display. */
export function formatPropertyTime(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}
