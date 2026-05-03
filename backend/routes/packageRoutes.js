const express = require('express');
const router = express.Router();
const { getPackages, createPackage, updatePackage, deletePackage } = require('../controllers/packageController');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadImage } = require('../middleware/upload');

router.route('/')
  .get(getPackages)
  .post(protect, admin, uploadImage, createPackage);

router.route('/:id')
  .put(protect, admin, uploadImage, updatePackage)
  .delete(protect, admin, deletePackage);

module.exports = router;
