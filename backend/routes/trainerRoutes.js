const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getTrainers, getTrainerProfile,
  createTrainer, updateTrainer,
  deleteTrainer, resetTrainerPassword,
  applyTrainer
} = require('../controllers/trainerController');

// Public / member
router.get('/', getTrainers);
router.post('/apply', applyTrainer);

// Trainer own profile
router.get('/profile', protect, getTrainerProfile);

// Admin only
router.post('/',                protect, admin, createTrainer);
router.put('/:id',              protect, admin, updateTrainer);
router.delete('/:id',           protect, admin, deleteTrainer);
router.post('/:id/reset-password', protect, admin, resetTrainerPassword);

module.exports = router;
