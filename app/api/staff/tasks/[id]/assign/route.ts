import { NextResponse } from 'next/server';
import { assignTask } from '@/lib/server/housekeeping';
import { handler, HttpError, readJson, requireAdmin } from '@/lib/server/http';
import { assignSchema, firstIssue } from '@/lib/validation';

/** POST /api/staff/tasks/:id/assign { username } — admin assigns a room that needs cleaning to a housekeeper. */
export const POST = handler(async (req: Request, { params }: { params: { id: string } }) => {
  await requireAdmin();
  const parsed = assignSchema.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, firstIssue(parsed.error));
  await assignTask(params.id, parsed.data.username);
  return NextResponse.json({ ok: true });
});
