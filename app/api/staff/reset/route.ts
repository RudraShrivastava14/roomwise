import { NextResponse } from 'next/server';
import { getDb, seedDatabase } from '@/lib/server/db';
import { handler, requireAdmin } from '@/lib/server/http';

/** POST /api/staff/reset — admin only: restore the demo property (times re-anchored to now). */
export const POST = handler(async () => {
  await requireAdmin();
  await seedDatabase(await getDb());
  return NextResponse.json({ ok: true });
});
