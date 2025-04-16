// controllers/customerController.js
import User from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import { resetPasswordRequestSchema, updatePasswordSchema } from '../validators/authValidator.js';
import { billingInfoSchema } from '../validators/customerValidator.js';
import { generateResetCode, recoveryCodeEmail } from '../utils/helper.js';


export const updateProfile = async (req, res) => {
  try {
    const { name, email, gender, removeAvatar } = req.body;
    const userId = req.user.id;

    const updateFields = {
      name,
      email,
      gender,
    };

    if (req.file) {
      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      updateFields.avatar = avatarPath;
    } else if (removeAvatar) {
      updateFields.avatar = null;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true });

    res.status(200).json({
      success: true,
      msg: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        gender: updatedUser.gender,
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
      return res.status(400).json({ success: false, msg: 'User not found or uses social login' });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return res.status(401).json({ success: false, msg: 'Old password is incorrect' });

    if (newPassword !== confirmPassword) return res.status(400).json({ success: false, msg: 'Passwords do not match' });

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
}

export const changePassword = async (req, res) => {
  try {
    const { code, oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user || user.socialOnly) {
      return res.status(400).json({ success: false, msg: 'User not found or uses social login' });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return res.status(401).json({ success: false, msg: 'Old password is incorrect' });

    if (newPassword !== confirmPassword) return res.status(400).json({ success: false, msg: 'Passwords do not match' });

    if (user.resetCode !== code || user.resetCodeExpire < Date.now()) {
      return res.status(400).json({ success: false, msg: 'Invalid or expired reset code' });
    }

    user.password = newPassword;
    user.resetCode = undefined;
    user.resetCodeExpire = undefined;
    await user.save();


    res.status(200).json({ success: true, msg: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Password change failed', error: error.message });
  }
};


export const updatePreferences = async (req, res) => {
  try {
    const { preferences } = req.body;
    const userId = req.user.id;

    const profile = await CustomerProfile.findOneAndUpdate(
      { user: userId },
      { preferences },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, msg: 'Preferences updated', preferences: profile.preferences });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Updating preferences failed', error: error.message });
  }
};

// Update Billing Information
export const updateBillingInfo = async (req, res) => {
  try {
    const { error } = billingInfoSchema.validate(req.body.billingInfo);
    if (error) return res.status(400).json({ success: false, error: error.details[0].message });

    const { billingInfo } = req.body;
    const userId = req.user.id;

    const profile = await CustomerProfile.findOneAndUpdate(
      { user: userId },
      { billingInfo },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, msg: 'Billing information updated', billingInfo: profile.billingInfo });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Updating billing info failed', error: error.message });
  }
};

export const disableAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { action } = req.body;

    if (action === 'disable') {
      await User.findByIdAndUpdate(userId, { disable: true });
      res.status(200).json({ success: true, msg: 'User account disabled successfully' });
    } else if (action === 'delete') {
      await User.findByIdAndDelete(userId);
      res.status(200).json({ success: true, msg: 'User account deleted successfully' });
    } else {
      return res.status(400).json({ success: false, msg: 'Invalid action. Use "disable" or "delete"' });
    }

    res.status(200).json({ success: true, msg: 'Account has been disabled until next login', accountStatus: profile.accountStatus });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Disabling account failed', error: error.message });
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

    if (!profile) return res.status(404).json({ success: false, msg: 'Profile not found' });
    res.status(200).json({ success: true, msg: 'Avatar removed successfully', profile });
  }
  catch (error) {
    res.status(500).json({ success: false, msg: 'Removing avatar failed', error: error.message });
  }
};
