import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkStaffPassword, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/server/auth';
import { handler, HttpError, readJson } from '@/lib/server/http';

const loginSchema = z.object({ password: z.string().min(1).max(200) });

export const POST = handler(async (req: Request) => {
  const parsed = loginSchema.safeParse(await readJson(req));
  if (!parsed.success || !checkStaffPassword(parsed.data.password)) {
    throw new HttpError(401, 'Incorrect staff password');
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions);
  return res;
});
