import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { requireRole } from './auth';
import { createAdminUserHandler } from './admin-users';
import { bootstrapOwner } from '../scripts/bootstrap-owner';

// Test requireRole middleware
describe('requireRole', () => {
  it('allows admin', async () => {
    const app = express();
    app.get('/a', (req, _res, next) => { (req as any).user = { role: 'admin' }; next(); }, requireRole('admin','owner'), (_req,res) => res.end('ok'));
    const server = app.listen(0);
    const port = (server.address() as any).port;
    const res = await fetch(`http://127.0.0.1:${port}/a`);
    server.close();
    assert.equal(res.status, 200);
  });

  it('blocks user', async () => {
    const app = express();
    app.get('/a', (req, _res, next) => { (req as any).user = { role: 'user' }; next(); }, requireRole('admin','owner'), (_req,res) => res.end('ok'));
    const server = app.listen(0);
    const port = (server.address() as any).port;
    const res = await fetch(`http://127.0.0.1:${port}/a`);
    server.close();
    assert.equal(res.status, 403);
  });
});

// Test createAdminUserHandler
describe('createAdminUserHandler', () => {
  it('owner can create admin', async () => {
    const store: any = {
      getUserByEmail: async () => null,
      createUser: async (u: any) => u,
    };
    const app = express();
    app.use(express.json());
    app.post('/api/admin/users', (req, _res, next) => { (req as any).user = { role: 'owner' }; next(); }, requireRole('owner'), createAdminUserHandler(store));
    const server = app.listen(0);
    const port = (server.address() as any).port;
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', username: 'a', password: 'p', name: 'a' })
    });
    server.close();
    assert.equal(res.status, 201);
  });

  it('admin cannot create admin', async () => {
    const store: any = {
      getUserByEmail: async () => null,
      createUser: async (u: any) => u,
    };
    const app = express();
    app.use(express.json());
    app.post('/api/admin/users', (req, _res, next) => { (req as any).user = { role: 'admin' }; next(); }, requireRole('owner'), createAdminUserHandler(store));
    const server = app.listen(0);
    const port = (server.address() as any).port;
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', username: 'a', password: 'p', name: 'a' })
    });
    server.close();
    assert.equal(res.status, 403);
  });
});

// Test bootstrapOwner
describe('bootstrapOwner', () => {
  it('creates owner when none exists', async () => {
    let created: any = null;
    const store = {
      getAllUsers: async () => [],
      createUser: async (u: any) => { created = u; return u; }
    } as any;
    process.env.OWNER_EMAIL = 'o@example.com';
    process.env.OWNER_PASSWORD = 'pw';
    await bootstrapOwner(store);
    assert.equal(created.role, 'owner');
  });

  it('no-op when owner exists', async () => {
    let created = false;
    const store = {
      getAllUsers: async () => [{ role: 'owner' }],
      createUser: async () => { created = true; }
    } as any;
    process.env.OWNER_EMAIL = 'o@example.com';
    process.env.OWNER_PASSWORD = 'pw';
    await bootstrapOwner(store);
    assert.equal(created, false);
  });
});
