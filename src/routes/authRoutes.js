import express from 'express';
import {
  registerUser,
  loginUser,
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
  verifyAccount,
} from '../controllers/authController.js';
import '../auth/facebook.js';
import '../auth/apple.js';
import '../auth/google.js';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// Password Reset Routes
router.post('/reset-password/request', requestPasswordReset);
router.post('/reset-password/verify', verifyResetCode);
router.post('/reset-password/reset', resetPassword);
router.put('/verify-account', verifyAccount);

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: false, // disable session if you're using JWT
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.redirect(`http://localhost:5173/create?token=${token}`);
  }
);

// Redirect to Facebook
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

// Facebook callback
router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.redirect(`http://localhost:5173/create?token=${token}`);
  }
);

// Apple login start
router.get('/apple', passport.authenticate('apple', {
  scope: ['name', 'email']
}));

// Apple callback
router.post('/apple/callback',
  passport.authenticate('apple', {
    failureRedirect: '/login',
    session: false,
  }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.redirect(`http://localhost:5173/create?token=${token}`);
  }
);

export default router;
