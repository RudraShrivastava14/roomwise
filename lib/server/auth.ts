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

// ---- Signed tokens (shared by staff and guest sessions) ----

/**
 * Stateless signed token: base64url(JSON payload + kind + exp) "." HMAC.
 * `kind` stops a staff cookie from ever being accepted as a guest one, and vice versa.
 */
export function signToken(kind: string, data: object, ttlSeconds: number, now = Date.now()): string {
  const payload = Buffer.from(
    JSON.stringify({ ...data, kind, exp: Math.floor(now / 1000) + ttlSeconds })
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function readToken(kind: string, token: string | undefined, now = Date.now()): Record<string, unknown> | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.kind !== kind || typeof data.exp !== 'number' || data.exp * 1000 <= now) return null;
    return data;
  } catch {
    return null;
  }
}

/** HMAC of a value with the server secret, e.g. to store verification codes without storing the code. */
export function keyedHash(value: string): string {
  return sign(value);
}

// ---- Staff sessions ----

export function createSessionToken(session: StaffSession, now = Date.now()): string {
  return signToken('staff', session, SESSION_TTL_SECONDS, now);
}

export function parseSessionToken(token: string | undefined, now = Date.now()): StaffSession | null {
  const data = readToken('staff', token, now);
  if (!data) return null;
  return { username: String(data.username), displayName: String(data.displayName), role: data.role === 'admin' ? 'admin' : 'staff' };
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
