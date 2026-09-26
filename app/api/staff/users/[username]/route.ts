import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import { StaffUserDoc } from '@/lib/server/password';
import { handler, HttpError, requireAdmin } from '@/lib/server/http';

/** DELETE /api/staff/users/:username — admin only. The person is signed out on their next request. */
export const DELETE = handler(async (_req: Request, { params }: { params: { username: string } }) => {
  await requireAdmin();
  const db = await getDb();
  const res = await db.collection<StaffUserDoc>('staff_users').deleteOne({ _id: params.username.toLowerCase() });
  if (res.deletedCount === 0) throw new HttpError(404, 'No such staff account');
  return NextResponse.json({ ok: true });
});
