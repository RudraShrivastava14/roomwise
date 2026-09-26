import 'server-only';
import { randomInt } from 'crypto';
import { cookies } from 'next/headers';
import { GuestSession } from '../types';
import { getDb } from './db';
import { keyedHash, readToken, signToken } from './auth';
import { safeEqual } from './password';
import { HttpError } from './http';
import { EmailNotConfiguredError, sendVerificationCode } from './mailer';

export const GUEST_COOKIE = 'rw_guest';
const GUEST_TTL_SECONDS = 30 * 24 * 60 * 60;
const CODE_TTL_MS = 10 * 60_000;
const RESEND_COOLDOWN_MS = 60_000;
const MAX_ATTEMPTS = 5;

/**
 * Reviewers can sign in as this address without an inbox: its code is returned
 * to the browser instead of emailed. Every other address gets a real email.
 */
export const DEMO_GUEST_EMAIL = 'guest@demo.roomwise';

interface CodeDoc {
  _id: string; // email
  name: string;
  codeHash: string; // HMAC of email+code; the code itself is never stored
  expiresAt: Date;
  sentAt: Date;
  attempts: number;
}

interface GuestDoc {
  _id: string; // email
  name: string;
  createdAt: string;
  lastLoginAt: string;
}

async function codes() {
  const db = await getDb();
  return db.collection<CodeDoc>('guest_codes'); // TTL index (see db.ts) deletes expired codes
}

const hashCode = (email: string, code: string) => keyedHash(`guest-code:${email}:${code}`);

/**
 * Step 1: email a 6-digit code. Works as sign-up and sign-in: a new email
 * must come with a name, a returning one reuses the stored name.
 */
export async function requestCode(email: string, name: string | undefined, now = new Date()): Promise<{ demoCode?: string }> {
  const db = await getDb();
  const col = await codes();
  const [existing, previous] = await Promise.all([
    db.collection<GuestDoc>('guests').findOne({ _id: email }),
    col.findOne({ _id: email }),
  ]);
  // A first-time guest asking for a second code shouldn't have to retype their name.
  const displayName = name ?? existing?.name ?? previous?.name;
  if (!displayName) throw new HttpError(400, 'Enter your name to create your account');

  if (previous && now.getTime() - previous.sentAt.getTime() < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - (now.getTime() - previous.sentAt.getTime())) / 1000);
    throw new HttpError(429, `Please wait ${wait}s before asking for another code`);
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await col.updateOne(
    { _id: email },
    { $set: { name: displayName, codeHash: hashCode(email, code), expiresAt: new Date(now.getTime() + CODE_TTL_MS), sentAt: now, attempts: 0 } },
    { upsert: true }
  );

  if (email === DEMO_GUEST_EMAIL) return { demoCode: code };

  try {
    await sendVerificationCode(email, displayName, code);
  } catch (err) {
    await col.deleteOne({ _id: email }); // let them retry immediately
    if (err instanceof EmailNotConfiguredError) {
      throw new HttpError(503, `Email sending isn't set up yet. Use the demo address ${DEMO_GUEST_EMAIL} for now.`);
    }
    console.error('[mail]', err);
    throw new HttpError(502, "We couldn't send the email. Check the address and try again.");
  }
  return {};
}

/** Step 2: check the code. Five wrong tries burns the code. */
export async function verifyCode(email: string, code: string, now = new Date()): Promise<GuestSession> {
  const col = await codes();
  const doc = await col.findOne({ _id: email });
  if (!doc || doc.expiresAt < now) throw new HttpError(400, 'This code has expired. Ask for a new one.');
  if (doc.attempts >= MAX_ATTEMPTS) {
    await col.deleteOne({ _id: email });
    throw new HttpError(429, 'Too many wrong codes. Ask for a new one.');
  }
  if (!safeEqual(hashCode(email, code), doc.codeHash)) {
    const left = MAX_ATTEMPTS - doc.attempts - 1;
    if (left <= 0) {
      await col.deleteOne({ _id: email });
      throw new HttpError(429, 'Too many wrong codes. Ask for a new one.');
    }
    await col.updateOne({ _id: email }, { $inc: { attempts: 1 } });
    throw new HttpError(400, `That code is not right (${left} ${left === 1 ? 'try' : 'tries'} left)`);
  }

  await col.deleteOne({ _id: email }); // one-time use
  const db = await getDb();
  await db.collection<GuestDoc>('guests').updateOne(
    { _id: email },
    { $set: { name: doc.name, lastLoginAt: now.toISOString() }, $setOnInsert: { createdAt: now.toISOString() } },
    { upsert: true }
  );
  return { email, name: doc.name };
}

export function createGuestToken(session: GuestSession): string {
  return signToken('guest', session, GUEST_TTL_SECONDS);
}

export function currentGuest(): GuestSession | null {
  const data = readToken('guest', cookies().get(GUEST_COOKIE)?.value);
  return data ? { email: String(data.email), name: String(data.name) } : null;
}

export function requireGuest(): GuestSession {
  const guest = currentGuest();
  if (!guest) throw new HttpError(401, 'Please sign in to book');
  return guest;
}

export const guestCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: GUEST_TTL_SECONDS,
};
