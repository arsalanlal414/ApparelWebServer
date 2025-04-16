import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import {
  registerSchema,
  loginSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
} from '../validators/authValidator.js';
import { generateResetCode, generateUniqueUserId, recoveryCodeEmail, verifyAccountEmail } from '../utils/helper.js';

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
    if (existingUser) return res.status(400).json({ success: false, msg: 'User already exists' });

    const fetchUserId = await generateUniqueUserId();

    const user = await User.create({ name, email, password, role, userId: fetchUserId });
    const token = generateToken(user);

    const response = await verifyAccountEmail(user);

    res.status(201).json({
      success: true,
      msg: 'User registered successfully',
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
    res.status(500).json({ success: false, msg: 'Registration failed', error: error.message });
  }
};

// export const loginUser = async (req, res) => {
//   try {

//     const { error } = loginSchema.validate(req.body);
//     if (error) return res.status(400).json({ success: false, error: error.details[0].message });

//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ success: false, msg: 'User not found' });

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) return res.status(401).json({ success: false, msg: 'Invalid credentials' });

//     const token = generateToken(user);
//     res.status(200).json({
//       success: true,
//       msg: 'Login successful',
//       user: {
//         id: user._id,
//         name: user.name,
//         role: user.role,
//         email: user.email,
//       },
//       token,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, msg: 'Login failed', error: error.message });
//   }
// };

// Request Password Reset

export const loginUser = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, error: error.details[0].message });

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, msg: 'User not found' });

    if(user.disable) {
      return res.status(400).json({ success: false, msg: 'Account disabled' });
    }

    if (user.socialOnly) {
      return res.status(400).json({ success: false, msg: 'Use your social account to login' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, msg: 'Invalid credentials' });

    await user.updateOne({ lastLogin: Date.now() }, { new: true });

    const token = generateToken(user);
    res.status(200).json({
      success: true,
      msg: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Login failed', error: error.message });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { error } = resetPasswordRequestSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, error: error.details[0].message });
    
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.socialOnly) {
      return res.status(400).json({ success: false, msg: 'User not found or uses social login' });
    }

    const resetCode = generateResetCode();
    user.resetCode = resetCode;
    user.resetCodeExpire = Date.now() + 15 * 60 * 1000; 

    await user.save();
  
    const sendEmail = await recoveryCodeEmail(user, resetCode);
    if (!sendEmail) {
      return res.status(500).json({ success: false, msg: 'Error sending email' });
    }

    res.status(200).json({ success: true, msg: 'Reset code sent to email' });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Error sending reset code', error: error.message });
  }
};

// Verify Reset Code
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.socialOnly) {
      return res.status(400).json({ success: false, msg: 'User not found or uses social login' });
    }

    // Check if code matches and is not expired
    if (user.resetCode !== code || user.resetCodeExpire < Date.now()) {
      return res.status(400).json({ success: false, msg: 'Invalid or expired reset code' });
    }

    res.status(200).json({ success: true, msg: 'Reset code verified' });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Verification failed', error: error.message });
  }
};

// export const adminPasswordReset = async (req, res) => {
//   try {
//     const { error } = adminPasswordResetSchema.validate(req.body);
//     if (error) return res.status(400).json({ success: false, error: error.details[0].message });

//     const { email, code, newPassword } = req.body;
//     if (newPassword !== confirmPassword) {
//       return res.status(400).json({ success: false, msg: 'Passwords do not match' });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ success: false, msg: 'User not found' });
//     }

//     if (user.resetCode !== code || user.resetCodeExpire < Date.now()) {
//       return res.status(400).json({ success: false, msg: 'Invalid or expired reset code' });
//     }

//     user.password = newPassword;
//     await user.save();    
//     res.status(200).json({ success: true, msg: 'Password reset successfully' });
//   } catch (error) {
//     res.status(500).json({ success: false, msg: 'Password reset failed', error: error.message });
//   }
// };

{}
// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { error } = resetPasswordSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, error: error.details[0].message });

    const { email, code, newPassword, confirmPassword } = req.body;
    console.log('code: ', code);

    const user = await User.findOne({ email });
    
    if (!user || user.socialOnly) {
      return res.status(400).json({ success: false, msg: 'User not found or uses social login' });
    }

    // Verify reset code again
    if (user.resetCode !== code || user.resetCodeExpire < Date.now()) {
      return res.status(400).json({ success: false, msg: 'Invalid or expired reset code' });
    }

    // Set new password and clear reset fields
    user.password = newPassword;
    user.resetCode = undefined;
    user.resetCodeExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, msg: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Password reset failed', error: error.message });
  }
};

export const verifyAccount = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = User.findById(userId);
    if (!user) {
      return res.status(400).json({ success: false, msg: 'User not found' });
    }
    
    const update = await user.updateOne({ isVerified: true });
    if (!update) {
      return res.status(400).json({ success: false, msg: 'Account verification failed' });
    }

    res.status(200).json({ success: true, msg: 'Account verified successfully' });
  }
  catch (error) {
    res.status(500).json({ success: false, msg: 'Account verification failed', error: error.message });
  }
};

