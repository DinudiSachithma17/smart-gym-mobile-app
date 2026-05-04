const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema({
  trainerId: {
    type: String,
    unique: true,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    minlength: [5, 'Name must be at least 5 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: 18,
    max: 60,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\d{10}$/, 'Phone number must be exactly 10 digits'],
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  passwordChanged: {
    type: Boolean,
    default: false,
  },
  profileImage: {
    type: String,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('Trainer', trainerSchema);
