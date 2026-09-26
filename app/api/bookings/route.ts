import { NextResponse } from 'next/server';
import { createBooking } from '@/lib/server/bookings';
import { requireGuest } from '@/lib/server/guest-auth';
import { handler, HttpError, readJson } from '@/lib/server/http';
import { bookingSchema, firstIssue } from '@/lib/validation';
import { propertyDate } from '@/lib/time';

/** POST /api/bookings — reserve one exact room for a stay. Requires a verified guest. */
export const POST = handler(async (req: Request) => {
  const guest = requireGuest();
  const parsed = bookingSchema(propertyDate()).safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, firstIssue(parsed.error));
  const booking = await createBooking(parsed.data, guest);
  return NextResponse.json({ booking }, { status: 201 });
});
