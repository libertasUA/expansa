import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const SALT_BYTES = 16;
const KEY_BYTES = 64;

/**
 * scrypt from the standard library, with a per-password salt.
 *
 * This whole credential path is temporary — real authentication is Apple, Google
 * and Steam, per ADR 0005 — but a repository holding passwords as given is a
 * pattern that outlives the reason it was tolerable, and gets copied into places
 * where it matters.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = await scrypt(password, salt, KEY_BYTES);
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, expectedHex] = stored.split(':');
  if (saltHex === undefined || expectedHex === undefined) {
    return false;
  }

  const expected = Buffer.from(expectedHex, 'hex');
  const derived = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);

  // Constant-time: a length-dependent or early-exit comparison leaks how much of
  // the hash matched, which is enough to reconstruct it one byte at a time.
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
