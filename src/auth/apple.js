import passport from 'passport';
import AppleStrategy from 'passport-apple';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const privateKeyPath = path.resolve(process.env.APPLE_PRIVATE_KEY_PATH);
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

passport.use(new AppleStrategy({
  clientID: process.env.APPLE_CLIENT_ID,
  teamID: process.env.APPLE_TEAM_ID,
  keyID: process.env.APPLE_KEY_ID,
  privateKey,
  callbackURL: 'http://localhost:5000/api/auth/apple/callback',
  passReqToCallback: true
}, async (req, accessToken, refreshToken, idToken, profile, done) => {
  try {
    const email = idToken.email || profile.email;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: `${profile.name?.firstName || "Apple"} ${profile.name?.lastName || "User"}`,
        email,
        password: Math.random().toString(36).slice(-8),
        avatar: null,
        role: 'customer',
        loginProvider: 'apple',
        socialOnly: true
      });
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));
