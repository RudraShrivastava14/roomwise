import 'server-only';
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export interface StaffUserDoc {
  _id: string; // username, lowercase
  displayName: string;
  passwordHash: string; // "<salt hex>:<scrypt hex>"
  createdAt: string;
  createdBy: string;
}

export function safeEqual(a: string | Buffer, b: string | Buffer): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** scrypt with a per-user random salt; only the hash is ever stored. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const hash = await scrypt(password, Buffer.from(saltHex, 'hex'), 64);
  return safeEqual(hash, Buffer.from(hashHex, 'hex'));
}
