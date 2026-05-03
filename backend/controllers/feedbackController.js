const Feedback = require('../models/Feedback');
const fs = require('fs');
const path = require('path');

const buildFileUrl = (req, filePath) =>
  filePath ? `${req.protocol}://${req.get('host')}/${filePath.replace(/\\/g, '/')}` : null;

// @desc  Create feedback (member)
exports.createFeedback = async (req, res) => {
  try {
    const { type, trainerId, rating, message } = req.body;
    const imageUrl = req.file ? buildFileUrl(req, req.file.path) : null;
    const count = await Feedback.countDocuments();
    const feedbackId = `FBK${String(count + 1).padStart(3, '0')}`;
    const feedback = await Feedback.create({
      feedbackId,
      memberId: req.user._id,
      type, trainerId: trainerId || undefined, rating: Number(rating), message, imageUrl,
    });
    res.status(201).json(feedback);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc  Get my feedback (member)
exports.getMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ memberId: req.user._id })
      .populate('trainerId', 'name')
      .sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get all feedback (admin)
exports.getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate('memberId', 'name email')
      .populate('trainerId', 'name')
      .sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get public gym feedback for landing page
exports.getPublicFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ type: 'Gym', rating: { $gte: 4 } })
      .populate('memberId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get feedback for a specific trainer
exports.getTrainerFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ type: 'Trainer', trainerId: req.params.trainerId })
      .populate('memberId', 'name')
      .sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Update feedback (member — only if not viewed by admin)
// @route PUT /api/feedback/:id
exports.updateFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findOne({ _id: req.params.id, memberId: req.user._id });
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    if (feedback.viewedByAdmin) return res.status(403).json({ message: 'This feedback has been reviewed by admin and can no longer be edited' });

    const { rating, message } = req.body;
    if (rating) feedback.rating = Number(rating);
    if (message) feedback.message = message;
    if (req.file) {
      if (feedback.imageUrl) {
        const oldPath = feedback.imageUrl.split('/uploads/')[1];
        if (oldPath) fs.unlink(path.join('uploads', oldPath), () => {});
      }
      feedback.imageUrl = buildFileUrl(req, req.file.path);
    }
    await feedback.save();
    res.json(feedback);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc  Delete feedback (member — only if not viewed by admin)
// @route DELETE /api/feedback/:id
exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findOne({ _id: req.params.id, memberId: req.user._id });
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    if (feedback.viewedByAdmin) return res.status(403).json({ message: 'This feedback has been reviewed by admin and can no longer be deleted' });
    if (feedback.imageUrl) {
      const oldPath = feedback.imageUrl.split('/uploads/')[1];
      if (oldPath) fs.unlink(path.join('uploads', oldPath), () => {});
    }
    await feedback.deleteOne();
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Admin views a feedback → marks as viewed (locks member edit/delete)
// @route PATCH /api/feedback/:id/view
exports.markViewed = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { viewedByAdmin: true, status: 'Reviewed' },
      { new: true }
    );
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
