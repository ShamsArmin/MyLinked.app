import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { GOOGLE_CALLBACK_URL } from '../config/url';
import { storage } from '../../server/storage';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        let user = email ? await storage.getUserByEmail(email) : undefined;
        if (!user) {
          user = await storage.createUser({
            username: email || profile.id,
            email: email || null,
            name: profile.displayName || '',
            password: '',
          } as any);
        }
        return done(null, user as any);
      } catch (err) {
        return done(err as any);
      }
    }
  )
);

export default passport;
