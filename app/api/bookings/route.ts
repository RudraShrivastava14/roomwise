import { NextResponse } from 'next/server';
import { createBooking } from '@/lib/server/bookings';
import { handler, HttpError, readJson } from '@/lib/server/http';
import { bookingSchema, firstIssue } from '@/lib/validation';
import { propertyDate } from '@/lib/time';

/** POST /api/bookings — reserve one exact room for a stay. Public (guest-facing). */
export const POST = handler(async (req: Request) => {
  const parsed = bookingSchema(propertyDate()).safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, firstIssue(parsed.error));
  const booking = await createBooking(parsed.data);
  return NextResponse.json({ booking }, { status: 201 });
});
