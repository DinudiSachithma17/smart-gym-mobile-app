const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createClass,
  getClasses,
  getTrainerClasses,
  assignMemberToClass,
  deleteClass
} = require('../controllers/classController');

router.route('/')
  .post(protect, admin, createClass)
  .get(protect, getClasses);

router.get('/trainer/:trainerId', protect, getTrainerClasses);

router.post('/:id/assign', protect, admin, assignMemberToClass);

router.delete('/:id', protect, admin, deleteClass);

module.exports = router;
