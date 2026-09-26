import { NextResponse } from 'next/server';
import { requestCode } from '@/lib/server/guest-auth';
import { handler, HttpError, readJson } from '@/lib/server/http';
import { firstIssue, requestCodeSchema } from '@/lib/validation';

/** POST /api/guest/request-code { email, name? } — emails a 6-digit sign-in code (sign-up and sign-in are the same flow). */
export const POST = handler(async (req: Request) => {
  const parsed = requestCodeSchema.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, firstIssue(parsed.error));
  const result = await requestCode(parsed.data.email, parsed.data.name);
  return NextResponse.json({ ok: true, ...result });
});
