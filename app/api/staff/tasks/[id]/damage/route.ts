import { NextResponse } from 'next/server';
import { reportDamage } from '@/lib/server/housekeeping';
import { handler, HttpError, readJson, requireStaff } from '@/lib/server/http';
import { damageReportSchema, firstIssue } from '@/lib/validation';

export const POST = handler(async (req: Request, { params }: { params: { id: string } }) => {
  const staff = await requireStaff();
  const parsed = damageReportSchema.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, firstIssue(parsed.error));
  await reportDamage(params.id, parsed.data, staff);
  return NextResponse.json({ ok: true });
});
