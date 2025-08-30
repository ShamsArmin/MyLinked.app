import { test } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
process.env.DB_GUARD_BYPASS = '1';

const { postReferralRequestHandler } = await import('./routes');
const { db } = await import('./db');
const { storage } = await import('./storage');

// Stub database and storage methods
(db as any).query = { referralRequests: { findFirst: async () => null } };
(storage as any).createReferralRequest = async () => ({ id: 1 });

function mockReqRes(body: any = {}, headers: any = {}, user?: any) {
  const req: any = { body, headers, user };
  const res: any = {
    statusCode: 200,
    body: undefined as any,
    status(code: number) { this.statusCode = code; return this; },
    json(data: any) { this.body = data; return this; }
  };
  return { req, res };
}

test('401 when no cookie/token', async () => {
  const { req, res } = mockReqRes({
    requesterName: 'n', requesterEmail: 'e', fieldOfWork: 'f',
    description: 'd', linkTitle: 't', linkUrl: 'u', targetUserId: 1
  });
  await postReferralRequestHandler(req, res);
  assert.strictEqual(res.statusCode, 401);
});

test('422 when referral data missing', async () => {
  const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET!);
  const { req, res } = mockReqRes({}, { authorization: `Bearer ${token}` });
  await postReferralRequestHandler(req, res);
  assert.strictEqual(res.statusCode, 422);
});

test('201 on valid payload + auth', async () => {
  const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET!);
  const { req, res } = mockReqRes({
    requesterName: 'n', requesterEmail: 'e', fieldOfWork: 'f',
    description: 'd', linkTitle: 't', linkUrl: 'u', targetUserId: 1
  }, { authorization: `Bearer ${token}` });
  await postReferralRequestHandler(req, res);
  assert.strictEqual(res.statusCode, 201);
  assert.ok(res.body.id);
});
