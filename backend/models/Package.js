const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  packageId: {
    type: String,
    unique: true,
    required: true,
  },
  planName: {
    type: String,
    required: [true, 'Plan name is required'],
  },
  planType: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Annually'],
    required: [true, 'Plan type is required'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
  },
  durationMonths: {
    type: Number, // 1 = Monthly, 3 = Quarterly, 12 = Annually
    required: true,
  },
  benefits: {
    type: [String],
    default: [],
  },
  badge: {
    type: String, // e.g. "Save 10%", "Best Value"
  },
  notes: {
    type: String,
  },
  imageUrl: {
    type: String,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('Package', packageSchema);
