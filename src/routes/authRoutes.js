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
router.post('/request-reset-code', requestPasswordReset);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);
router.put('/verify-account', verifyAccount);

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err?.message === 'LOCAL_ACCOUNT_EXISTS') {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=account-exists`);
    }

    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=authentication-failed`);
    }

    // User authenticated successfully
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.redirect(`${process.env.CLIENT_URL}/oauth/callback?token=${token}`);
  })(req, res, next);
});

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
