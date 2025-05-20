import Notification from "../models/Notification.js";

export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().populate('recipient', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications', error: error.message });
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ recipient: userId }).populate('recipient', 'name email avatar').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications', error: error.message });
  }
};

export const updateUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('userId: ', userId);
    const notifcation = await Notification.updateMany({ recipient: userId }, { $set: { isRead: true } });
    console.log('notifcation: ', notifcation);
    if(!notifcation) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Notifications updated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notifications', error: error.message });
  }
};

export const updateNotificationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.notificationId;

    await Notification.updateOne({ recipient: userId, _id: notificationId }, { $set: { isRead: true } });

    res.status(200).json({
      success: true,
      message: 'Notification status updated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notification status', error: error.message });
  }
};  


// admin notifications to notify on each register, payments and templatess filter from notifications
// export const getAdminNotifications = async (req, res) => {
//   try {
//     const notifications = await Notification.find().populate('recipient', 'name email avatar').sort({ createdAt: -1 });
//     const filteredNotifications = notifications.filter(notification => {
//       return notification.type === 'register' || notification.type === 'subscription' || notification.type === 'template';
//     });

//     res.status(200).json({
//       success: true,
//       message: 'Admin notifications retrieved successfully',
//       notifications: filteredNotifications,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Failed to retrieve admin notifications', error: error.message });
//   }
// };


export const getAdminNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get all notifications first (for filtering)
    const allNotifications = await Notification.find()
      .populate('recipient', 'name email avatar')
      .sort({ createdAt: -1 });

    // Filter notifications by type
    const filteredNotifications = allNotifications.filter(notification => {
      return notification.type === 'register' ||
        notification.type === 'subscription' ||
        notification.type === 'template';
    });

    // Calculate total for pagination
    const totalCount = filteredNotifications.length;

    // Apply pagination to filtered results
    const paginatedNotifications = filteredNotifications.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      message: 'Admin notifications retrieved successfully',
      notifications: paginatedNotifications,
      pagination: {
        total: totalCount,
        page,
        pages: Math.ceil(totalCount / limit),
        limit
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin notifications',
      error: error.message
    });
  }
};