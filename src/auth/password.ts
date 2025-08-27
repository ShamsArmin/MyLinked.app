import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'crypto';
import bcrypt from 'bcrypt';

const ITER = 100_000;
const LEN = 64;
const DIGEST = 'sha512';

export type HashAlgo = 'pbkdf2-sha512' | 'bcrypt';

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(plain, salt, ITER, LEN, DIGEST);
  return `pbkdf2$${ITER}$${DIGEST}$${LEN}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function needsRehash(stored: string): boolean {
  if (!stored.startsWith('pbkdf2$')) return true;
  const parts = stored.split('$');
  if (parts.length !== 6) return true;
  const it = parseInt(parts[1], 10);
  const digest = parts[2];
  const len = parseInt(parts[3], 10);
  return it < ITER || digest !== DIGEST || len < LEN;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (stored.startsWith('pbkdf2$')) {
    const [, itStr, digest, lenStr, saltHex, hashHex] = stored.split('$');
    const it = parseInt(itStr, 10);
    const len = parseInt(lenStr, 10);
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = pbkdf2Sync(plain, salt, it, len, digest as any);
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  }
  if (/^\$2[aby]\$/.test(stored)) {
    return bcrypt.compare(plain, stored);
  }
  if (/^[0-9a-f]+\.[0-9a-f]+$/i.test(stored)) {
    const [part1, part2] = stored.split('.');
    const a = Buffer.from(part1, 'hex');
    const b = Buffer.from(part2, 'hex');
    let derived = pbkdf2Sync(plain, b, ITER, a.length, DIGEST);
    if (derived.length === a.length && timingSafeEqual(derived, a)) return true;
    derived = pbkdf2Sync(plain, a, ITER, b.length, DIGEST);
    if (derived.length === b.length && timingSafeEqual(derived, b)) return true;
    return false;
  }
  return false;
}
