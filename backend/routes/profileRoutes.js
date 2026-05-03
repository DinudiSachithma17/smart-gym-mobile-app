const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadImage } = require('../middleware/upload');
const { getMyProfile, uploadProfileImage, updateProfile, changePassword } = require('../controllers/profileController');

router.get('/me', protect, getMyProfile);
router.post('/upload-image', protect, uploadImage, uploadProfileImage);
router.put('/update', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
