import { test } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcrypt';
import { pbkdf2Sync } from 'crypto';
import { createLocalStrategy } from './localStrategy';
import { hashPassword } from './password';
import type { IStorage } from '../../server/storage';

interface UserRec {
  id: number;
  username: string;
  usernameLower: string;
  email?: string;
  emailLower?: string;
  password: string;
}

class MockStorage implements IStorage {
  users = new Map<number, UserRec>();
  constructor(users: UserRec[]) {
    for (const u of users) this.users.set(u.id, { ...u });
  }
  async getUser(id: number) { return this.users.get(id); }
  async getUserByUsername(username: string) {
    return Array.from(this.users.values()).find(u => u.usernameLower === username);
  }
  async getUserByEmail(email: string) {
    return Array.from(this.users.values()).find(u => u.emailLower === email);
  }
  async createUser(user: any) { throw new Error('not impl'); }
  async updateUser(id: number, updates: any) {
    const u = this.users.get(id)!;
    Object.assign(u, updates);
    return u as any;
  }
  async updateSocialScore() { return undefined; }
  async deleteUser() { return false; }
  comparePasswords = async () => false;
  hashPassword = async () => '';
  // many other methods not used in tests
}

function run(strategy: any, body: any) {
  return new Promise<{ user?: any }>((resolve, reject) => {
    const req = { body } as any;
    strategy.success = (user: any) => resolve({ user });
    strategy.fail = () => resolve({});
    strategy.error = (err: any) => reject(err);
    strategy.authenticate(req);
  });
}

test('username case insensitive login and pbkdf2 user', async () => {
  const pw = await hashPassword('Arm.456');
  const storage = new MockStorage([{ id: 1, username: 'armintest', usernameLower: 'armintest', password: pw }]);
  const strategy = createLocalStrategy(storage);
  const res = await run(strategy, { username: 'Armintest', password: 'Arm.456' });
  assert.ok(res.user);    
});

test('legacy bcrypt rehashes', async () => {
  const bcryptHash = await bcrypt.hash('pass123', 10);
  const storage = new MockStorage([{ id: 2, username: 'bob', usernameLower: 'bob', password: bcryptHash }]);
  const strategy = createLocalStrategy(storage);
  const res = await run(strategy, { username: 'bob', password: 'pass123' });
  assert.ok(res.user);
  const updated = storage.users.get(2)!;
  assert.ok(updated.password.startsWith('pbkdf2$'));
});

test('legacy dot format rehashes', async () => {
  const salt = Buffer.from('0102030405060708', 'hex');
  const hash = pbkdf2Sync('secret', salt, 100_000, 64, 'sha512');
  const stored = `${hash.toString('hex')}.${salt.toString('hex')}`;
  const storage = new MockStorage([{ id: 3, username: 'alice', usernameLower: 'alice', password: stored }]);
  const strategy = createLocalStrategy(storage);
  const res = await run(strategy, { username: 'alice', password: 'secret' });
  assert.ok(res.user);
  const updated = storage.users.get(3)!;
  assert.ok(updated.password.startsWith('pbkdf2$'));
});

test('login by email', async () => {
  const pw = await hashPassword('hello');
  const storage = new MockStorage([{ id: 4, username: 'user', usernameLower: 'user', email: 'user@example.com', emailLower: 'user@example.com', password: pw }]);
  const strategy = createLocalStrategy(storage);
  const res = await run(strategy, { username: 'user@example.com', password: 'hello' });
  assert.ok(res.user);
});
