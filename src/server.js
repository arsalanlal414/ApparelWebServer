import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './app.js';
import connectDB from './config/db.js';
import session from 'express-session';
import passport from 'passport';
import './auth/google.js'; // or facebook.js, apple.js
import User from './models/User.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.use(session({ secret: 'secret*123@nogoarea', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});


const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
