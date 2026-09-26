import 'server-only';
import { createHmac } from 'crypto';
import { cookies } from 'next/headers';
import { StaffSession } from '../types';
import { getDb } from './db';
import { safeEqual, verifyPassword } from './password';

export const SESSION_COOKIE = 'rw_staff';
const SESSION_TTL_SECONDS = 12 * 60 * 60; // one housekeeping shift
export const ADMIN_USERNAME = 'admin';

export type { StaffUserDoc } from './password';
import type { StaffUserDoc } from './password';

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET must be set (32+ chars)');
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

// ---- Login ----

/**
 * The admin account lives in env (STAFF_PASSWORD) so a fresh deployment is
 * never locked out; everyone else is a row in staff_users created by the admin.
 */
export async function authenticate(username: string, password: string): Promise<StaffSession | null> {
  const name = username.trim().toLowerCase();
  if (name === ADMIN_USERNAME) {
    const expected = process.env.STAFF_PASSWORD;
    return expected && safeEqual(password, expected)
      ? { username: ADMIN_USERNAME, displayName: 'Admin', role: 'admin' }
      : null;
  }
  const db = await getDb();
  const user = await db.collection<StaffUserDoc>('staff_users').findOne({ _id: name });
  if (!user || !(await verifyPassword(password, user.passwordHash))) return null;
  return { username: user._id, displayName: user.displayName, role: 'staff' };
}

// ---- Sessions ----

/** Stateless signed cookie: base64url(JSON session + exp) "." HMAC. */
export function createSessionToken(session: StaffSession, now = Date.now()): string {
  const payload = Buffer.from(
    JSON.stringify({ ...session, exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS })
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function parseSessionToken(token: string | undefined, now = Date.now()): StaffSession | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof data.exp !== 'number' || data.exp * 1000 <= now) return null;
    return { username: data.username, displayName: data.displayName, role: data.role };
  } catch {
    return null;
  }
}

/**
 * Current staff member, or null. Non-admin sessions are re-checked against
 * the database so removing someone locks them out immediately.
 */
export async function currentStaff(): Promise<StaffSession | null> {
  const session = parseSessionToken(cookies().get(SESSION_COOKIE)?.value);
  if (!session || session.role === 'admin') return session;
  const db = await getDb();
  const exists = await db.collection<StaffUserDoc>('staff_users').countDocuments({ _id: session.username }, { limit: 1 });
  return exists ? session : null;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
};
