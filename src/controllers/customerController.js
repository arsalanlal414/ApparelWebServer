// controllers/customerController.js

import User from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import { resetPasswordRequestSchema, updatePasswordSchema } from '../validators/authValidator.js';
import { billingInfoSchema, changePasswordSchema } from '../validators/customerValidator.js';
import { generateResetCode, recoveryCodeEmail } from '../utils/helper.js';
import Notification from '../models/Notification.js';


export const updateProfile = async (req, res) => {
  try {
    const { name, email, gender, deleteAccount } = req.body;
    const userId = req.user.id;

    console.log({gender})

    if (deleteAccount === 'true' || deleteAccount === true) {
      // permanent delete
      await User.findByIdAndDelete(userId);
      await CustomerProfile.findOneAndDelete({ user: userId });
      return res.status(200).json({ success: true, msg: 'Account deleted permanently' });
    }

    // if new avatar uploaded
    let avatarUrl = req.user.avatar;
    if (req.file) {
      // e.g. if using local storage you might do:
      avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, gender, avatar: avatarUrl },
      { new: true }
    );

    await Notification.create({ type: 'profile', title: 'Profile Updated', message: 'Profile updated successfully', recipient: userId });

    res.status(200).json({
      success: true,
      msg: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        gender: updatedUser.gender,
        avatar: updatedUser.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Profile update failed', error: error.message });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!user || user.socialOnly) {
      return res.status(400).json({ success: false, message: 'User not found or uses social login' });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Old password is incorrect' });

    if (newPassword !== confirmPassword) return res.status(400).json({ success: false, message: 'Passwords do not match' });

    const resetCode = generateResetCode();
    user.resetCode = resetCode;
    user.resetCodeExpire = Date.now() + 15 * 60 * 1000; 

    await user.save();
  
    const sendEmail = await recoveryCodeEmail(user, resetCode);
    if (!sendEmail) {
      return res.status(500).json({ success: false, message: 'Error sending email' });
    }

    res.status(200).json({ success: true, message: 'Reset code sent to email' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending reset code', error: error.message });
  }
}

export const changePassword = async (req, res) => {
  try{
    const { error } = changePasswordSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, error: error.details[0].message });

    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findById(userId);
    if (!user || user.socialOnly) {
      return res.status(400).json({ success: false, message: 'User not found or uses social login' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Old password is incorrect' });

    if (newPassword !== confirmPassword) return res.status(400).json({ success: false, message: 'Passwords do not match' });

    user.password = newPassword;
    await user.save();
    await Notification.create({ type: 'profile', title: 'Password Changed', message: 'Password Changed Successfully', recipient: user._id });

    res.status(200).json({ success: true, message: 'Password changed successfully' });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Password change failed', error: error.message });
  }
};


export const updatePreferences = async (req, res) => {
  try {
    console.log('req.body: ', req.body);
    const { preferences } = req.body;
    console.log('preferences: ', preferences);
    const userId = req.user.id;

    const profile = await CustomerProfile.findOneAndUpdate(
      { user: userId },
      { preferences },
      { new: true, upsert: true }
    );

    await Notification.create({ type: 'profile', title: 'Preferences Updated', message: 'Preferences updated successfully', recipient: userId });

    res.status(200).json({ success: true, message: 'Preferences updated', preferences: profile.preferences });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Updating preferences failed', error: error.message });
  }
};

export const updateBillingInfo = async (req, res) => {
  try {
    const { billingInfo } = req.body;
    const userId = req.user.id;

    const profile = await CustomerProfile.findOneAndUpdate(
      { user: userId },
      { billingInfo },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, message: 'Billing information updated', billingInfo: profile.billingInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Updating billing info failed', error: error.message });
  }
};

export const disableAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { action } = req.body;

    if (action === 'disable') {
      await User.findByIdAndUpdate(userId, { disable: true });
      res.status(200).json({ success: true, message: 'User account disabled successfully' });
    } else if (action === 'delete') {
      await User.findByIdAndDelete(userId);
      res.status(200).json({ success: true, message: 'User account deleted successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action. Use "disable" or "delete"' });
    }

    res.status(200).json({ success: true, message: 'Account has been disabled until next login', accountStatus: profile.accountStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Disabling account failed', error: error.message });
  }
};

export const removeAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await CustomerProfile.findOneAndUpdate(
      { user: userId },
      { $unset: { avatar: "" } }, // Remove avatar field
      { new: true }
    );

    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.status(200).json({ success: true, message: 'Avatar removed successfully', profile });
  }
  catch (error) {
    res.status(500).json({ success: false, message: 'Removing avatar failed', error: error.message });
  }
};

export const profileSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await CustomerProfile.findOne({ user: userId }).populate('user', 'name email avatar');

    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.status(200).json({ success: true, profile });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Profile settings failed', error: error.message });
  }
};
