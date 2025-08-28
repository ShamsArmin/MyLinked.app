import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';

mock.module('./db.ts', () => ({
  db: { query: { referralRequests: { findFirst: async () => null } } },
}));

mock.module('./storage.ts', () => ({
  storage: {
    createReferralRequest: async (data: any) => ({ id: 1, ...data }),
  },
}));

const { createReferralRequestHandler } = await import('./handlers/referral-requests.ts');

function buildServer(authenticated: boolean) {
  const app = express();
  app.use(express.json());
  app.post('/api/referral-requests', (req: any, res, next) => {
    req.isAuthenticated = () => authenticated;
    if (authenticated) {
      req.user = { id: 'user1' };
    }
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
  }, createReferralRequestHandler);
  return http.createServer(app);
}

async function request(server: http.Server, path: string, body: any) {
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as any;
  const res = await fetch(`http://localhost:${port}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  server.close();
  return { status: res.status, body: json };
}

test('POST /api/referral-requests returns 401 when unauthenticated', async () => {
  const server = buildServer(false);
  const res = await request(server, '/api/referral-requests', {});
  assert.equal(res.status, 401);
  assert.equal(res.body.message, 'Unauthorized');
});

test('POST /api/referral-requests returns 422 for invalid payload', async () => {
  const server = buildServer(true);
  const res = await request(server, '/api/referral-requests', { requesterName: 'A' });
  assert.equal(res.status, 422);
  assert.equal(res.body.message, 'Validation error');
});

test('POST /api/referral-requests returns 201 for valid payload', async () => {
  const server = buildServer(true);
  const payload = {
    requesterName: 'John',
    requesterEmail: 'john@example.com',
    fieldOfWork: 'engineering',
    description: 'desc',
    linkTitle: 'title',
    linkUrl: 'http://example.com',
    targetUserId: '550e8400-e29b-41d4-a716-446655440000',
  };
  const res = await request(server, '/api/referral-requests', payload);
  assert.equal(res.status, 201);
  assert.equal(res.body.message, 'Referral request sent successfully');
  assert.ok(res.body.id);
});
