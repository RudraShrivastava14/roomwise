import { NextResponse } from 'next/server';
import { advanceTask } from '@/lib/server/housekeeping';
import { handler, HttpError, readJson, requireStaff } from '@/lib/server/http';
import { firstIssue, statusUpdateSchema } from '@/lib/validation';

/** PATCH /api/staff/tasks/:id { status } — move a room one step along Dirty → Cleaning → Inspection → Ready. */
export const PATCH = handler(async (req: Request, { params }: { params: { id: string } }) => {
  const staff = await requireStaff();
  const parsed = statusUpdateSchema.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, firstIssue(parsed.error));
  await advanceTask(params.id, parsed.data.status, staff);
  return NextResponse.json({ ok: true });
});
