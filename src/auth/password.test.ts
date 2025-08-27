import { test } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcrypt';
import { hashPassword, verifyPassword, needsRehash } from './password';
import { pbkdf2Sync } from 'crypto';

const plain = 's3cret!';

test('pbkdf2 hash and verify', async () => {
  const hashed = await hashPassword(plain);
  assert.ok(hashed.startsWith('pbkdf2$'));
  assert.equal(await verifyPassword(plain, hashed), true);
  assert.equal(await verifyPassword('wrong', hashed), false);
  assert.equal(needsRehash(hashed), false);
});

test('legacy dot format hash.salt and salt.hash', async () => {
  const salt = Buffer.from('a1b2c3d4e5f60708', 'hex');
  const hash = pbkdf2Sync(plain, salt, 100_000, 64, 'sha512');
  const hs = `${hash.toString('hex')}.${salt.toString('hex')}`;
  const sh = `${salt.toString('hex')}.${hash.toString('hex')}`;
  assert.equal(await verifyPassword(plain, hs), true);
  assert.equal(await verifyPassword(plain, sh), true);
});

test('bcrypt legacy hashes', async () => {
  const bcryptHash = await bcrypt.hash(plain, 10);
  assert.equal(await verifyPassword(plain, bcryptHash), true);
  assert.equal(await verifyPassword('wrong', bcryptHash), false);
  assert.equal(needsRehash(bcryptHash), true);
});
