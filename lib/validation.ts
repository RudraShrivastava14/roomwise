import { z } from 'zod';
import { nightsBetween } from './time';

export const MAX_STAY_NIGHTS = 30;
export const MAX_BOOKING_WINDOW_DAYS = 365;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine(d => !Number.isNaN(new Date(`${d}T00:00:00Z`).getTime()), 'Not a real date');

/**
 * Validates a stay against "today" at the property. Shared by the booking
 * form (for instant feedback) and the API (which is the real gate).
 */
export function stayDatesSchema(today: string) {
  return z
    .object({ checkIn: isoDate, checkOut: isoDate })
    .refine(s => s.checkIn >= today, { message: 'Check-in cannot be in the past', path: ['checkIn'] })
    .refine(s => s.checkOut > s.checkIn, { message: 'Check-out must be after check-in', path: ['checkOut'] })
    .refine(s => nightsBetween(s.checkIn, s.checkOut) <= MAX_STAY_NIGHTS, {
      message: `Stays are limited to ${MAX_STAY_NIGHTS} nights`,
      path: ['checkOut'],
    })
    .refine(s => nightsBetween(today, s.checkIn) <= MAX_BOOKING_WINDOW_DAYS, {
      message: 'Bookings open 12 months ahead',
      path: ['checkIn'],
    });
}

export function bookingSchema(today: string) {
  return z
    .object({
      roomId: z.string().regex(/^room_\d{3}$/, 'Unknown room'),
      guestName: z.string().trim().min(2, 'Enter your full name').max(80, 'Name is too long'),
      guestEmail: z.string().trim().toLowerCase().email('Enter a valid email').max(120),
      isEarlyCheckIn: z.boolean().default(false),
    })
    .and(stayDatesSchema(today));
}

export type BookingInput = z.infer<ReturnType<typeof bookingSchema>>;

export const statusUpdateSchema = z.object({
  status: z.enum(['CLEANING', 'INSPECTION', 'READY']),
});

export const damageReportSchema = z.object({
  item: z.string().trim().min(2).max(80),
  description: z.string().trim().min(3).max(500),
  severity: z.enum(['MINOR', 'MAJOR']),
});

/** First human-readable message from a zod error. */
export function firstIssue(err: z.ZodError): string {
  return err.issues[0]?.message ?? 'Invalid input';
}

export const assignSchema = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,32}$/, 'Pick a staff member'),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Enter your username').max(32),
  password: z.string().min(1, 'Enter your password').max(200),
});

export const newStaffSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,32}$/, 'Username: 3–32 letters, numbers, dots, dashes or underscores')
    .refine(u => u !== 'admin', 'That username is reserved'),
  displayName: z.string().trim().min(2, 'Enter their name').max(60),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});
