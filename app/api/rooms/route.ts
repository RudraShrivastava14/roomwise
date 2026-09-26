import { NextResponse } from 'next/server';
import { roomsForStay } from '@/lib/server/bookings';
import { handler, HttpError } from '@/lib/server/http';
import { firstIssue, stayDatesSchema } from '@/lib/validation';
import { propertyDate } from '@/lib/time';

export const dynamic = 'force-dynamic';

/** GET /api/rooms?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD — public room explorer data. */
export const GET = handler(async (req: Request) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = stayDatesSchema(propertyDate()).safeParse(params);
  if (!parsed.success) throw new HttpError(400, firstIssue(parsed.error));
  const rooms = await roomsForStay(parsed.data.checkIn, parsed.data.checkOut);
  return NextResponse.json({ rooms });
});
