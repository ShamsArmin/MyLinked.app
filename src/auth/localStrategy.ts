import { Strategy as LocalStrategy } from 'passport-local';
import type { Request } from 'express';
import type { IStorage } from '../../server/storage';
import { verifyPassword, needsRehash, hashPassword } from './password';

export function createLocalStrategy(storage: IStorage) {
  return new LocalStrategy(
    { usernameField: 'username', passReqToCallback: true },
    async (req: Request, _identifier: string, password: string, done) => {
      try {
        const raw = req.body.username?.trim();
        const identifier = raw?.toLowerCase();
        if (!identifier) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        let user = await storage.getUserByUsername(identifier);
        if (!user && raw.includes('@')) {
          user = await storage.getUserByEmail(identifier);
        }
        if (!user) {
          console.log('LocalStrategy user lookup failed', { identifier });
          return done(null, false, { message: 'Invalid username or password' });
        }
        const ok = await verifyPassword(password, (user as any).password);
        console.log('LocalStrategy password check', { userId: user.id, ok });
        if (!ok) return done(null, false, { message: 'Invalid username or password' });
        if (needsRehash((user as any).password)) {
          const newHash = await hashPassword(password);
          await storage.updateUser(user.id, { password: newHash, usernameLower: user.username.toLowerCase() } as any);
          (user as any).password = newHash;
        }
        return done(null, user as any);
      } catch (err) {
        return done(err as any);
      }
    }
  );
}
