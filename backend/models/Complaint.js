const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    unique: true,
    required: true,
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 500,
  },
  fileUrl: {
    type: String, // optional file upload
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved'],
    default: 'Pending',
  },
  viewedByAdmin: {
    type: Boolean,
    default: false,
  },
  adminReply: {
    type: String,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
