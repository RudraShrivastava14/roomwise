import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'rw_staff';
const SESSION_TTL_SECONDS = 12 * 60 * 60; // one housekeeping shift

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET must be set (32+ chars)');
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function checkStaffPassword(candidate: string): boolean {
  const expected = process.env.STAFF_PASSWORD;
  if (!expected) return false;
  return safeEqual(candidate, expected);
}

/** Stateless session: "<expiryEpochSeconds>.<hmac>". No session table needed for a single staff role. */
export function createSessionToken(now = Date.now()): string {
  const exp = String(Math.floor(now / 1000) + SESSION_TTL_SECONDS);
  return `${exp}.${sign(exp)}`;
}

export function isValidSessionToken(token: string | undefined, now = Date.now()): boolean {
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || !safeEqual(sig, sign(exp))) return false;
  return Number(exp) * 1000 > now;
}

export function isStaffRequest(): boolean {
  return isValidSessionToken(cookies().get(SESSION_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
};
