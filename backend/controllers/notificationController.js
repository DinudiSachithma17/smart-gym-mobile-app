const Notification = require('../models/Notification');

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user's notifications
// @route   GET /api/notifications/my
// @access  Private
const getMyNotifications = async (req, res) => {
  try {
    const userRole = req.user.role; // 'Member' or 'Trainer'
    const userId = req.user._id;

    // A user should see:
    // 1. 'All' target
    // 2. 'All Members' or 'All Trainers' depending on their role
    // 3. 'Single Member' or 'Single Trainer' if it matches their specificUserId
    
    const query = {
      $or: [
        { target: 'All' },
        { target: `All ${userRole}s` },
        { target: `Single ${userRole}`, specificUserId: userId }
      ]
    };

    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a notification
// @route   POST /api/notifications
// @access  Admin
const createNotification = async (req, res) => {
  try {
    const count = await Notification.countDocuments();
    const notificationId = `N${String(count + 1).padStart(3, '0')}`;
    const notification = await Notification.create({ ...req.body, notificationId });
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a notification
// @route   PUT /api/notifications/:id
// @access  Admin
const updateNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Admin
const deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getNotifications, getMyNotifications, createNotification, updateNotification, deleteNotification };
