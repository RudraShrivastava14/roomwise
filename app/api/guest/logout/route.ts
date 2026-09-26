import { NextResponse } from 'next/server';
import { GUEST_COOKIE, guestCookieOptions } from '@/lib/server/guest-auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GUEST_COOKIE, '', { ...guestCookieOptions, maxAge: 0 });
  return res;
}
