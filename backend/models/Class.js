const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  classId: {
    type: String,
    unique: true,
    required: true,
  },
  className: {
    type: String,
    required: true,
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
