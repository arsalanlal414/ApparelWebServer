import CustomerProfile from "../models/CustomerProfile.js";
import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import { updateCustomerAdminSchema } from "../validators/customerValidator.js";
import Notification from "../models/Notification.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const usersList = async (req, res) => {
  try {
    // Fetch all users from the database who has a role of 'customer' also implement pagination
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 10;

    const users = await User.find({ role: 'customer' }).skip(skip).limit(limit);

    const userCount = await User.countDocuments({ role: 'customer' });
    const totalPages = Math.ceil(userCount / limit);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      users,
      totalUsers: userCount,
      totalPages,
      currentPage: Math.floor(skip / limit) + 1,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve users', error: error.message });
  }
}

// edit customer profile
export const updateCustomerByAdmin = async (req, res) => {
  const { userId } = req.params;

  // Validate request body
  const { error, value } = updateCustomerAdminSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((d) => d.message),
    });
  }

  try {
    const userUpdates = {};
    if (value.name) userUpdates.name = value.name;
    if (value.email) userUpdates.email = value.email;
    if (value.gender) userUpdates.gender = value.gender;
    if (value.password) userUpdates.password = await bcrypt.hash(value.password, 10); // Hash the password

    const updatedUser = await User.findByIdAndUpdate(userId, userUpdates, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update customer profile if fields exist
    const { preferences, billingInfo, accountStatus } = value;

    const profileUpdates = {};
    if (preferences) profileUpdates.preferences = preferences;
    if (billingInfo) profileUpdates.billingInfo = billingInfo;
    if (accountStatus) profileUpdates.accountStatus = accountStatus;

    const updatedProfile = await CustomerProfile.findOneAndUpdate(
      { user: userId },
      { $set: { ...profileUpdates } },
      { new: true, upsert: true }
    );
    res.status(200).json({
      success: true,
      message: 'Customer and profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        gender: updatedUser.gender,
        // password: updatedUser.password,
      },
      preferences: updatedProfile.preferences,
      billingInfo: updatedProfile.billingInfo,
      accountStatus: updatedProfile.accountStatus,

    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
};

// Disable or parmanently delete user by admin
export const disableUserByAdmin = async (req, res) => {
  const { userId } = req.params;
  const { action } = req.body; // 'disable' or 'delete'

  try {
    if (action === 'disable') {
      await User.findByIdAndUpdate(userId, { disable: true });
      res.status(200).json({ success: true, message: 'User account disabled successfully' });
    } else if (action === 'delete') {
      // Permanently delete the user account
      await User.findByIdAndDelete(userId);
      res.status(200).json({ success: true, message: 'User account deleted successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action. Use "disable" or "delete"' });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
};

export const customersList = async (req, res) => {
  try {
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 10;

    const customers = await CustomerProfile.find().populate('user').skip(skip).limit(limit);

    const totalCustomers = await CustomerProfile.countDocuments();
    const totalPages = Math.ceil(totalCustomers / limit);

    res.status(200).json({
      success: true,
      message: 'Customers retrieved successfully',
      customers,
      totalCustomers,
      totalPages,
      currentPage: Math.floor(skip / limit) + 1,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve customers', error: error.message });
  }
};

// Get single user details by ID (for admin)
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get customer profile if exists
    const profile = await CustomerProfile.findOne({ user: userId });

    res.status(200).json({
      success: true,
      user,
      profile: profile || {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
      error: error.message
    });
  }
};

// Update user profile with avatar by admin
export const updateUserProfileByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, gender, role } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If new avatar uploaded
    let avatarUrl = user.avatar;
    if (req.file) {
      // If user already has avatar, delete old one
      if (user.avatar && !user.avatar.includes('default')) {
        try {
          const __dirname = path.dirname(fileURLToPath(import.meta.url));
          const oldAvatarPath = path.join(__dirname, '..', '..', user.avatar);
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        } catch (err) {
          console.error('Error deleting old avatar:', err);
        }
      }
      avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, gender, avatar: avatarUrl, role },
      { new: true }
    ).select('-password');

    // Create notification for the user
    await Notification.create({
      type: 'info',
      title: 'Profile Updated by Admin',
      message: 'Your profile has been updated by an administrator',
      recipient: userId
    });

    res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Profile update failed',
      error: error.message
    });
  }
};

// Change user password by admin
export const changeUserPasswordByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.socialOnly) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change password for social login accounts'
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    // Create notification for the user
    await Notification.create({
      type: 'Info',
      title: 'Password Changed',
      message: 'Your password has been changed by an administrator',
      recipient: userId
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Password change failed',
      error: error.message
    });
  }
};

// Update user preferences by admin
export const updateUserPreferencesByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { preferences } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const profile = await CustomerProfile.findOneAndUpdate(
      { user: userId },
      { preferences },
      { new: true, upsert: true }
    );

    // Create notification for the user
    await Notification.create({
      type: 'info',
      title: 'Preferences Updated',
      message: 'Your preferences have been updated by an administrator',
      recipient: userId
    });

    res.status(200).json({
      success: true,
      message: 'User preferences updated successfully',
      preferences: profile.preferences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Updating preferences failed',
      error: error.message
    });
  }
};

// Update user billing info by admin
export const updateUserBillingByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { billingInfo } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const profile = await CustomerProfile.findOneAndUpdate(
      { user: userId },
      { billingInfo },
      { new: true, upsert: true }
    );

    // Create notification for the user
    await Notification.create({
      type: 'info',
      title: 'Billing Information Updated',
      message: 'Your billing information has been updated by an administrator',
      recipient: userId
    });

    res.status(200).json({
      success: true,
      message: 'User billing information updated successfully',
      billingInfo: profile.billingInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Updating billing info failed',
      error: error.message
    });
  }
};