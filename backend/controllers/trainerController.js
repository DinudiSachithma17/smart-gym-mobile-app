const User = require('../models/User');
const Trainer = require('../models/Trainer');
const generateToken = require('../utils/generateToken');

/* ── Auto-generate a strong readable password ── */
const generatePassword = () => {
  const adjectives = ['Strong', 'Fast', 'Bold', 'Iron', 'Power', 'Flex', 'Peak', 'Fit'];
  const nouns      = ['Lion', 'Tiger', 'Eagle', 'Force', 'Beast', 'Hero', 'Star', 'Blaze'];
  const adj  = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num  = Math.floor(100 + Math.random() * 900);   // 3-digit
  const sym  = ['@', '#', '!', '$'][Math.floor(Math.random() * 4)];
  return `${adj}${noun}${num}${sym}`;                   // e.g. StrongLion472@
};

// @desc  Get all trainers (admin / public for member view)
// @route GET /api/trainers
exports.getTrainers = async (req, res) => {
  try {
    const trainers = await Trainer.find().sort({ createdAt: -1 });
    res.json(trainers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get trainer profile for logged-in trainer
// @route GET /api/trainers/profile
exports.getTrainerProfile = async (req, res) => {
  try {
    const trainer = await Trainer.findOne({ userId: req.user._id });
    if (!trainer) return res.status(404).json({ message: 'Trainer profile not found' });
    res.json(trainer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Create trainer (admin) — auto-generates password & User account
// @route POST /api/trainers
exports.createTrainer = async (req, res) => {
  const { name, email, specialization, age, phone, address, city } = req.body;
  try {
    // Check no duplicate email
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'A user with this email already exists' });

    // Generate credentials
    const password = generatePassword();

    // Create User account with Trainer role
    const userCount = await User.countDocuments();
    const userId = `M${String(userCount + 1).padStart(3, '0')}`;
    const newUser = await User.create({ userId, name, email, password, role: 'Trainer' });

    // Create Trainer profile
    const trainerCount = await Trainer.countDocuments();
    const trainerId = `TR${String(trainerCount + 1).padStart(3, '0')}`;
    const trainer = await Trainer.create({
      trainerId, userId: newUser._id,
      name, email, specialization,
      age: Number(age), phone, address, city,
    });

    // Return trainer data + generated password (admin shows it once)
    res.status(201).json({
      trainer,
      credentials: {
        email,
        password,  // plain-text for one-time display — never stored plain-text
        message: 'Share these credentials with the trainer. The password is shown only once.',
      },
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc  Update trainer (admin)
// @route PUT /api/trainers/:id
exports.updateTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
    // Sync name/email in User doc too
    if (req.body.name || req.body.email) {
      await User.findByIdAndUpdate(trainer.userId, {
        ...(req.body.name  && { name:  req.body.name }),
        ...(req.body.email && { email: req.body.email }),
      });
    }
    res.json(trainer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc  Reset trainer password (admin) — generates a new password
// @route POST /api/trainers/:id/reset-password
exports.resetTrainerPassword = async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' });

    if (trainer.passwordChanged) {
      return res.status(400).json({ message: 'Admin cannot reset password. Trainer has already updated it for security.' });
    }

    const newPassword = generatePassword();
    const user = await User.findById(trainer.userId).select('+password');
    if (!user) return res.status(404).json({ message: 'Trainer user account not found' });
    user.password = newPassword;
    await user.save();

    res.json({
      credentials: {
        email: trainer.email,
        password: newPassword,
        message: 'Password reset successfully. Share with the trainer.',
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Delete trainer (admin)
// @route DELETE /api/trainers/:id
exports.deleteTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
    // Remove associated User account too
    await User.findByIdAndDelete(trainer.userId);
    await trainer.deleteOne();
    res.json({ message: 'Trainer deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Apply as trainer (Public)
// @route POST /api/trainers/apply
exports.applyTrainer = async (req, res) => {
  const { name, email, specialization, age, phone, address, city } = req.body;
  try {
    // Check if email already used in User or Trainer
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email already exists' });

    // Since this is a "registration", we create the User and Trainer immediately
    // or we could create a "Pending" status. Let's create them directly with a default password.
    // The user said: "a trainer should be able to register... providing details".
    // "After the trainer submits... admin should be able to manage".
    
    // We'll follow the "Admin adds" flow but triggered by the trainer.
    // We'll generate a password for them and they can change it later.
    
    const password = generatePassword();
    const userCount = await User.countDocuments();
    const userId = `M${String(userCount + 1).padStart(3, '0')}`;
    const newUser = await User.create({ userId, name, email, password, role: 'Trainer' });

    const trainerCount = await Trainer.countDocuments();
    const trainerId = `TR${String(trainerCount + 1).padStart(3, '0')}`;
    const trainer = await Trainer.create({
      trainerId, userId: newUser._id,
      name, email, specialization,
      age: Number(age), phone, address, city,
    });

    res.status(201).json({
      message: 'Registration successful! Use these credentials to login for the first time.',
      credentials: { email, password }
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
