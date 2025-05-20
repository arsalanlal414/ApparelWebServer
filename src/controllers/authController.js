import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import {
  registerSchema,
  loginSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
} from '../validators/authValidator.js';
import { generateResetCode, generateUniqueUserId, recoveryCodeEmail, verifyAccountEmail } from '../utils/helper.js';
import Notification from '../models/Notification.js';
import CustomerProfile from '../models/CustomerProfile.js';

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

export const registerUser = async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, error: error.details[0].message });

    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'User already exists' });

    const fetchUserId = await generateUniqueUserId();

    const user = await User.create({ name, email, password, role, userId: fetchUserId });
    const token = generateToken(user);

    const response = await verifyAccountEmail(user);
    await Notification.create({ type: 'register', title: 'New Account Registered', message: 'User registered successfully', recipient: user._id });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        role: user.role,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, error: error.details[0].message });

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid email or password' });

    if (user.isVerified === false) {
      return res.status(403).json({ success: false, message: 'Account not verified. Check your email for verification link.' });
    }

    if (user.disable) {
      return res.status(400).json({ success: false, message: 'Account disabled' });
    }

    if (user.socialOnly) {
      return res.status(400).json({ success: false, message: 'Use your social account to login' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    await user.updateOne({ lastLogin: Date.now() }, { new: true });

    const token = generateToken(user);
    console.log('token: ', token)
    const notification = await Notification.create({ type: 'login', title: 'Account Login', message: 'Login successful', recipient: user._id });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
        avatar: user.avatar,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { error } = resetPasswordRequestSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, error: error.details[0].message });

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.socialOnly) {
      return res.status(400).json({ success: false, message: 'User not found or uses social login' });
    }

    const resetCode = generateResetCode();
    user.resetCode = resetCode;
    user.resetCodeExpire = Date.now() + 15 * 60 * 1000;

    const data = await user.save();
    console.log('data: ', data);

    const sendEmail = await recoveryCodeEmail(user, resetCode);
    if (!sendEmail) {
      return res.status(500).json({ success: false, message: 'Error sending email' });
    }

    res.status(200).json({ success: true, message: 'Reset code sent to email' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending reset code', error: error.message });
  }
};

// Verify Reset Code
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.socialOnly) {
      return res.status(400).json({ success: false, message: 'User not found or uses social login' });
    }

    // Check if code matches and is not expired
    if (user.resetCode !== code || user.resetCodeExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
    }

    res.status(200).json({ success: true, message: 'Reset code verified' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    console.log('req.body: ', req.body);
    const { error } = resetPasswordSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, error: error.details[0].message });

    const { email, code, newPassword, confirmPassword } = req.body;
    console.log('code: ', code);

    const user = await User.findOne({ email });

    if (!user || user.socialOnly) {
      return res.status(400).json({ success: false, message: 'User not found or uses social login' });
    }

    // Verify reset code again
    if (user.resetCode !== code || user.resetCodeExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
    }

    // Set new password and clear reset fields
    user.password = newPassword;
    user.resetCode = undefined;
    user.resetCodeExpire = undefined;
    await user.save();
    await Notification.create({ type: 'resetPassword', title: 'Password Changed', message: 'Password Changed Successfully', recipient: user._id });

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Password reset failed', error: error.message });
  }
};

export const verifyAccount = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log("req: ", req.body);

    const user = User.findById(userId);
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    console.log('user: ', user);

    const update = await User.findByIdAndUpdate(userId, { isVerified: true });
    if (!update) {
      return res.status(400).json({ success: false, message: 'Account verification failed' });
    }

    if (update.role !== 'admin') {
      const findCustomer = await CustomerProfile.findOne({ user: userId });
      if (!findCustomer) {
        await CustomerProfile.create({ user: userId });
      }
    }
    await Notification.create({ type: 'accountVerified', title: 'Account Verified', message: 'Account verified successfully', recipient: userId });

    res.status(200).json({ success: true, message: 'Account verified successfully' });
  }
  catch (error) {
    res.status(500).json({ success: false, message: 'Account verification failed', error: error.message });
  }
};

