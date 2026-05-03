const Complaint = require('../models/Complaint');
const fs = require('fs');
const path = require('path');

const buildFileUrl = (req, filePath) =>
  filePath ? `${req.protocol}://${req.get('host')}/${filePath.replace(/\\/g, '/')}` : null;

// @desc  Create complaint (member) — status starts as Pending
// @route POST /api/complaints
exports.createComplaint = async (req, res) => {
  try {
    const { name, email, category, priority, description } = req.body;
    const fileUrl = req.file ? buildFileUrl(req, req.file.path) : null;
    const count = await Complaint.countDocuments();
    const complaintId = `CMP${String(count + 1).padStart(3, '0')}`;
    const complaint = await Complaint.create({
      complaintId,
      memberId: req.user._id,
      name, email, category, priority, description, fileUrl,
      status: 'Pending',
    });
    res.status(201).json(complaint);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc  Get my complaints (member)
// @route GET /api/complaints/my
exports.getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ memberId: req.user._id }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get all complaints (admin)
// @route GET /api/complaints
exports.getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Admin opens/views a complaint → auto sets status to In Progress
// @route PATCH /api/complaints/:id/view
exports.markViewed = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Only move to In Progress if it's still Pending
    if (complaint.status === 'Pending') {
      complaint.status = 'In Progress';
      complaint.viewedByAdmin = true;
      await complaint.save();
    }

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Admin replies to complaint → auto sets status to Resolved
// @route PATCH /api/complaints/:id/reply
exports.replyComplaint = async (req, res) => {
  try {
    const { adminReply } = req.body;
    if (!adminReply || adminReply.trim().length === 0) {
      return res.status(400).json({ message: 'Reply message is required' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { adminReply: adminReply.trim(), status: 'Resolved' },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    res.json(complaint);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc  Update complaint (member - only if Pending & not yet viewed)
// @route PUT /api/complaints/:id
exports.updateComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    if (complaint.status !== 'Pending') return res.status(400).json({ message: 'Only Pending complaints can be edited' });
    if (complaint.viewedByAdmin) return res.status(403).json({ message: 'This complaint has been reviewed by admin and can no longer be edited' });

    const { category, priority, description } = req.body;
    if (category) complaint.category = category;
    if (priority) complaint.priority = priority;
    if (description) complaint.description = description;
    if (req.file) {
      if (complaint.fileUrl) {
        const oldPath = complaint.fileUrl.split('/uploads/')[1];
        if (oldPath) fs.unlink(path.join('uploads', oldPath), () => {});
      }
      complaint.fileUrl = buildFileUrl(req, req.file.path);
    }
    await complaint.save();
    res.json(complaint);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc  Delete complaint (member - any status)
// @route DELETE /api/complaints/:id
exports.deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ _id: req.params.id, memberId: req.user._id });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    if (complaint.fileUrl) {
      const oldPath = complaint.fileUrl.split('/uploads/')[1];
      if (oldPath) fs.unlink(path.join('uploads', oldPath), () => {});
    }
    await complaint.deleteOne();
    res.json({ message: 'Complaint deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
