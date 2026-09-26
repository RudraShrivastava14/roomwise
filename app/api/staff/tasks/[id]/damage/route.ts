import { NextResponse } from 'next/server';
import { reportDamage } from '@/lib/server/housekeeping';
import { handler, HttpError, readJson } from '@/lib/server/http';
import { damageReportSchema, firstIssue } from '@/lib/validation';

export const POST = handler(
  async (req: Request, { params }: { params: { id: string } }) => {
    const parsed = damageReportSchema.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, firstIssue(parsed.error));
    await reportDamage(params.id, parsed.data);
    return NextResponse.json({ ok: true });
  },
  { staffOnly: true }
);
