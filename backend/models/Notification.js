const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    unique: true,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Alert', 'Announcement', 'Information'],
    required: true,
  },
  target: {
    type: String,
    enum: ['All', 'All Members', 'All Trainers', 'Single Member', 'Single Trainer'],
    required: true,
  },
  specificUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.target === 'Single Member' || this.target === 'Single Trainer'; },
  },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
