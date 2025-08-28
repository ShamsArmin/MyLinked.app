import express from 'express';
import passport from 'passport';
import { GOOGLE_CALLBACK_PATH, GOOGLE_CALLBACK_URL } from '../config/url';
import '../auth/googleStrategy';

const router = express.Router();

router.get('/auth/google', (req, res, next) => {
  console.log('[OAuth] start → redirectUri:', GOOGLE_CALLBACK_URL);
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get(GOOGLE_CALLBACK_PATH, (req, res, next) => {
  passport.authenticate('google', { failureRedirect: '/login?oauth=google_failed' })(
    req,
    res,
    () => res.redirect('/dashboard')
  );
});

export default router;
