import { NextResponse } from 'next/server';
import { createGuestToken, GUEST_COOKIE, guestCookieOptions, verifyCode } from '@/lib/server/guest-auth';
import { handler, HttpError, readJson } from '@/lib/server/http';
import { firstIssue, verifyCodeSchema } from '@/lib/validation';

/** POST /api/guest/verify { email, code } — on success sets the guest session cookie. */
export const POST = handler(async (req: Request) => {
  const parsed = verifyCodeSchema.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, firstIssue(parsed.error));
  const guest = await verifyCode(parsed.data.email, parsed.data.code);
  const res = NextResponse.json({ guest });
  res.cookies.set(GUEST_COOKIE, createGuestToken(guest), guestCookieOptions);
  return res;
});
