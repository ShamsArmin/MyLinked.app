import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { db } from './db'; // make sure to import your database instance

passport.use(new LocalStrategy(
  async (username, password, done) => {
    // Replace with your actual user lookup logic
    const user = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (!user || !comparePassword(password, user.password)) {
      return done(null, false, { message: 'Incorrect credentials.' });
    }
    return done(null, user);
  }
));

// Serialize user to store user ID in the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
  done(null, user);
});

// Initialize Passport and restore authentication state, if any, from the session
app.use(passport.initialize());
app.use(passport.session());