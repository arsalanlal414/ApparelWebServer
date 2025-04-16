import CustomerProfile from "../models/CustomerProfile.js";
import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import { updateCustomerAdminSchema } from "../validators/customerValidator.js";
import { Mongoose } from "mongoose";

// format the date of last login and createdAt for each user
// const users = users.map((user) => {
//   return { 
//     ...user.toObject(), 
//     lastLogin: new Date(user.lastLogin).toISOString().slice(0, 10) + 
//        ' (' + new Date(user.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ')',
//     createdAt: new Date(user.createdAt).toISOString().slice(0, 10) +
//        ' (' + new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ')', 
//   };
// });


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
      msg: 'Users retrieved successfully',
      users,
      totalUsers: userCount,
      totalPages,
      currentPage: Math.floor(skip / limit) + 1,
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Failed to retrieve users', error: error.message });
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
      msg: 'Validation failed',
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
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    // Update customer profile if fields exist
    const { preferences, billingInfo, accountStatus } = value;

    const profileUpdates = {};
    if (preferences) profileUpdates.preferences = preferences;
    if (billingInfo) profileUpdates.billingInfo = billingInfo;
    if (accountStatus) profileUpdates.accountStatus = accountStatus;

    const updatedProfile = await CustomerProfile.findOneAndUpdate(
      { user: userId },
      { $set: {...profileUpdates} },
      { new: true, upsert: true }
    );
    res.status(200).json({
      success: true,
      msg: 'Customer and profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        gender: updatedUser.gender,
        password: updatedUser.password,
      },
      preferences: updatedProfile.preferences,
      billingInfo: updatedProfile.billingInfo,
      accountStatus: updatedProfile.accountStatus,

    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: 'Server error',
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
      res.status(200).json({ success: true, msg: 'User account disabled successfully' });
    } else if (action === 'delete') {
      // Permanently delete the user account
      await User.findByIdAndDelete(userId);
      res.status(200).json({ success: true, msg: 'User account deleted successfully' });
    } else {
      return res.status(400).json({ success: false, msg: 'Invalid action. Use "disable" or "delete"' });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: err.message,
    });
  }
};