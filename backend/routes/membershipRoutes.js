const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createMembership,
  getMyMemberships,
  getAllMemberships,
  approveMembership,
  rejectMembership,
  deleteMembership,
  createMembershipAdmin,
} = require('../controllers/membershipController');

router.post('/', protect, createMembership);
router.post('/admin', protect, admin, createMembershipAdmin);
router.get('/my', protect, getMyMemberships);
router.get('/', protect, admin, getAllMemberships);
router.put('/:id/approve', protect, admin, approveMembership);
router.put('/:id/reject',  protect, admin, rejectMembership);
router.delete('/:id',      protect, admin, deleteMembership);

module.exports = router;
