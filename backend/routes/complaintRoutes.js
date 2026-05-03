const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadFile } = require('../middleware/upload');
const {
  createComplaint, getMyComplaints, getAllComplaints,
  updateComplaint, markViewed, replyComplaint, deleteComplaint,
} = require('../controllers/complaintController');

router.post('/',              protect,           uploadFile, createComplaint);
router.get('/my',            protect,           getMyComplaints);
router.get('/',              protect, adminOnly, getAllComplaints);
router.put('/:id',           protect,           uploadFile, updateComplaint);
router.patch('/:id/view',    protect, adminOnly, markViewed);
router.patch('/:id/reply',   protect, adminOnly, replyComplaint);
router.delete('/:id',        protect,           deleteComplaint);

module.exports = router;
