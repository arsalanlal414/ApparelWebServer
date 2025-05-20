// import passport from 'passport';
// import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import User from '../models/User.js';

// passport.use(new GoogleStrategy({
//   clientID: process.env.GOOGLE_CLIENT_ID,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//   callbackURL: '/api/auth/google/callback',
// }, async (accessToken, refreshToken, profile, done) => {
//   const existingUser = await User.findOne({ email: profile.emails[0].value });
//   if (existingUser) return done(null, existingUser);

//   const newUser = await User.create({
//     googleId: profile.id,
//     name: profile.displayName,
//     email: profile.emails[0].value,
//     password: Math.random().toString(36).slice(-8),
//     avatar: profile.photos[0].value,
//     role: 'customer',
//     loginProvider: 'google',
//     socialOnly: true,
//   });
//   done(null, newUser);
// }));



// auth/google.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // 1) Does a user already exist with this social id?
    let user = await User.findOne({ googleId: profile.id });
    if (user) return done(null, user);

    // 2) Does a user already exist with this email?
    const email = profile.emails?.[0]?.value;
    const existing = await User.findOne({ email });
    if (existing) {
      // If they signed up locally (socialOnly=false), we block social login:
      if (!existing.socialOnly) {
        return done(
          // pass an error so passport will redirect to failureRedirect
          new Error('LOCAL_ACCOUNT_EXISTS'),
          false
        );
      }
      // otherwise, if they had previously signed up via social, let them in:
      return done(null, existing);
    }

    // 3) New user: create
    user = await User.create({
      googleId: profile.id,
      name: profile.displayName,
      email,
      password: Math.random().toString(36).slice(-8),
      avatar: profile.photos?.[0]?.value,
      role: 'customer',
      socialOnly: true,
      loginProvider: 'google'
    });

    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));
