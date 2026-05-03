const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadImage } = require('../middleware/upload');
const {
  createFeedback, getMyFeedback, getAllFeedback,
  updateFeedback, deleteFeedback, getTrainerFeedback,
  getPublicFeedback, markViewed,
} = require('../controllers/feedbackController');

router.get('/public',              getPublicFeedback);              // Open — no auth
router.post('/',         protect,           uploadImage, createFeedback);
router.get('/my',        protect,           getMyFeedback);
router.get('/',          protect, adminOnly, getAllFeedback);
router.get('/trainer/:trainerId', protect,  getTrainerFeedback);
router.put('/:id',       protect,           uploadImage, updateFeedback);   // Member edit
router.patch('/:id/view', protect, adminOnly, markViewed);                  // Admin view → locks edit
router.delete('/:id',    protect,           deleteFeedback);

module.exports = router;
