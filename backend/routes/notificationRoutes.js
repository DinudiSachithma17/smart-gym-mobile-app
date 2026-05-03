const express = require('express');
const router = express.Router();
const { getNotifications, getMyNotifications, createNotification, updateNotification, deleteNotification } = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/my').get(protect, getMyNotifications);

router.route('/')
  .get(protect, getNotifications)
  .post(protect, admin, createNotification);

router.route('/:id')
  .put(protect, admin, updateNotification)
  .delete(protect, admin, deleteNotification);

module.exports = router;
