import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import dotenv from 'dotenv';
import User from '../models/User.js'; // your user model

dotenv.config();

passport.use(new FacebookStrategy({
  clientID: process.env.FB_CLIENT_ID,
  clientSecret: process.env.FB_CLIENT_SECRET,
  callbackURL: 'http://localhost:5173/login',
  profileFields: ['id', 'emails', 'name', 'picture.type(large)']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ facebookId: profile.id });

    if (!user) {
      user = await User.findOne({ email: profile.emails?.[0]?.value });
    }

    if (!user) {
      user = await User.create({
        facebookId: profile.id,
        email: profile.emails?.[0]?.value,
        name: `${profile.name.givenName} ${profile.name.familyName}`,
        password: Math.random().toString(36).slice(-8), // optional dummy password
        role: 'customer',
        avatar: profile.photos?.[0]?.value,
        loginProvider: 'facebook',
        socialOnly: true,
      });
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));
