const Class = require('../models/Class');
const Trainer = require('../models/Trainer');
const User = require('../models/User');

// @desc    Create a new class (Admin)
// @route   POST /api/classes
// @access  Admin
exports.createClass = async (req, res) => {
  const { className, trainerId, date, time } = req.body;
  try {
    const classCount = await Class.countDocuments();
    const classId = `C${String(classCount + 1).padStart(3, '0')}`;

    const newClass = await Class.create({
      classId,
      className,
      trainerId,
      date,
      time,
      members: []
    });

    res.status(201).json(newClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private
exports.getClasses = async (req, res) => {
  try {
    const classes = await Class.find().populate('trainerId', 'name specialization').populate('members', 'name email');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get trainer's classes — accepts either Trainer doc _id OR User _id
// @route   GET /api/classes/trainer/:id
// @access  Private (Trainer/Admin)
exports.getTrainerClasses = async (req, res) => {
  try {
    // First try direct match (Trainer doc _id)
    let classes = await Class.find({ trainerId: req.params.trainerId }).populate('members', 'name email');

    // If nothing found, try looking up the Trainer by userId (User _id)
    if (classes.length === 0) {
      const trainerDoc = await Trainer.findOne({ userId: req.params.trainerId });
      if (trainerDoc) {
        classes = await Class.find({ trainerId: trainerDoc._id }).populate('members', 'name email');
      }
    }

    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign member to a class
// @route   POST /api/classes/:id/assign
// @access  Admin
exports.assignMemberToClass = async (req, res) => {
  const { memberId } = req.body;
  try {
    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });

    // Check if member already in class
    if (classDoc.members.includes(memberId)) {
      return res.status(400).json({ message: 'Member is already assigned to this class' });
    }

    classDoc.members.push(memberId);
    await classDoc.save();

    res.json({ message: 'Member assigned to class successfully', class: classDoc });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Admin
exports.deleteClass = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });
    await classDoc.deleteOne();
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
