import { NextResponse } from 'next/server';
import { authenticate, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/server/auth';
import { handler, HttpError, readJson } from '@/lib/server/http';
import { firstIssue, loginSchema } from '@/lib/validation';

/** POST /api/auth/login { username, password } — admin (env password) or a staff account created by the admin. */
export const POST = handler(async (req: Request) => {
  const parsed = loginSchema.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, firstIssue(parsed.error));
  const session = await authenticate(parsed.data.username, parsed.data.password);
  if (!session) throw new HttpError(401, 'Incorrect username or password');
  const res = NextResponse.json({ staff: session });
  res.cookies.set(SESSION_COOKIE, createSessionToken(session), sessionCookieOptions);
  return res;
});
