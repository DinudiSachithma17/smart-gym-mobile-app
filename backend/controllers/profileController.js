const User = require('../models/User');
const Trainer = require('../models/Trainer');
const fs = require('fs');
const path = require('path');

const buildFileUrl = (req, filePath) =>
  filePath ? `${req.protocol}://${req.get('host')}/${filePath.replace(/\\/g, '/')}` : null;

// @desc  Get my profile (member or trainer)
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    let profile = user.toObject();

    // If trainer, merge trainer-specific data
    if (user.role === 'Trainer') {
      const trainerData = await Trainer.findOne({ userId: user._id });
      if (trainerData) {
        const trainerObj = trainerData.toObject();
        // Preserve User _id but also expose Trainer doc _id separately
        profile = { ...profile, ...trainerObj, _id: user._id, trainerDocId: trainerObj._id };
      }
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Upload/update profile picture (member or trainer)
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const imageUrl = buildFileUrl(req, req.file.path);
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Remove old image if exists
    if (user.profileImage) {
      const oldPath = user.profileImage.split('/uploads/')[1];
      if (oldPath) fs.unlink(path.join('uploads', oldPath), () => {});
    }

    user.profileImage = imageUrl;
    await user.save();

    // Also update trainer record if applicable
    if (user.role === 'Trainer') {
      await Trainer.findOneAndUpdate({ userId: user._id }, { profileImage: imageUrl });
    }

    res.json({ profileImage: imageUrl, message: 'Profile picture updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Update profile info (name, phone, address etc.)
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    await user.save();

    // Update trainer record too
    if (user.role === 'Trainer') {
      const { specialization, phone, address, city } = req.body;
      await Trainer.findOneAndUpdate(
        { userId: user._id },
        { ...(name && { name }), ...(specialization && { specialization }), ...(phone && { phone }), ...(address && { address }), ...(city && { city }) },
        { new: true }
      );
    }

    const updated = await User.findById(req.user._id).select('-password');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc  Change password (any logged in user)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    // If trainer, mark that they've changed their password
    if (user.role === 'Trainer') {
      await Trainer.findOneAndUpdate({ userId: user._id }, { passwordChanged: true });
    }

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
