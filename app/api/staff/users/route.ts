import { NextResponse } from 'next/server';
import { MongoServerError } from 'mongodb';
import { getDb } from '@/lib/server/db';
import { hashPassword, StaffUserDoc } from '@/lib/server/password';
import { handler, HttpError, readJson, requireAdmin } from '@/lib/server/http';
import { firstIssue, newStaffSchema } from '@/lib/validation';
import { StaffMember } from '@/lib/types';

export const dynamic = 'force-dynamic';

const users = async () => (await getDb()).collection<StaffUserDoc>('staff_users');

/** GET /api/staff/users — admin only: list staff accounts (never returns password hashes). */
export const GET = handler(async () => {
  await requireAdmin();
  const docs = await (await users()).find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: 1 }).toArray();
  const staff: StaffMember[] = docs.map(d => ({ username: d._id, displayName: d.displayName, createdAt: d.createdAt }));
  return NextResponse.json({ staff });
});

/** POST /api/staff/users { username, displayName, password } — admin creates a login and hands it to the staff member. */
export const POST = handler(async (req: Request) => {
  const admin = await requireAdmin();
  const parsed = newStaffSchema.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, firstIssue(parsed.error));
  const { username, displayName, password } = parsed.data;
  try {
    await (await users()).insertOne({
      _id: username,
      displayName,
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
      createdBy: admin.username,
    });
  } catch (err) {
    if (err instanceof MongoServerError && err.code === 11000) {
      throw new HttpError(409, `Username "${username}" is already taken`);
    }
    throw err;
  }
  return NextResponse.json({ ok: true }, { status: 201 });
});
