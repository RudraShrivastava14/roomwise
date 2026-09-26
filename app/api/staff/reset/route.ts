import { NextResponse } from 'next/server';
import { getDb, seedDatabase } from '@/lib/server/db';
import { handler } from '@/lib/server/http';

/** POST /api/staff/reset — restore the demo property (times re-anchored to now). */
export const POST = handler(
  async () => {
    await seedDatabase(await getDb());
    return NextResponse.json({ ok: true });
  },
  { staffOnly: true }
);
