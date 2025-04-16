import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  const existingUser = await User.findOne({ email: profile.emails[0].value });
  if (existingUser) return done(null, existingUser);

  const newUser = await User.create({
    googleId: profile.id,
    name: profile.displayName,
    email: profile.emails[0].value,
    password: Math.random().toString(36).slice(-8),
    avatar: profile.photos[0].value,
    role: 'customer',
    loginProvider: 'google',
    socialOnly: true,
  });
  done(null, newUser);
}));
