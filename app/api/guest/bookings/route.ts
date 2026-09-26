import { NextResponse } from 'next/server';
import { bookingsFor } from '@/lib/server/bookings';
import { requireGuest } from '@/lib/server/guest-auth';
import { handler } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

/** GET /api/guest/bookings — the signed-in guest's own bookings. */
export const GET = handler(async () => {
  const guest = requireGuest();
  return NextResponse.json({ bookings: await bookingsFor(guest.email) });
});
