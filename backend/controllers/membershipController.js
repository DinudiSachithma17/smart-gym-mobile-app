const Membership = require('../models/Membership');
const Package = require('../models/Package');

// @desc  Create membership (member pays for package)
// @route POST /api/memberships
// @access Member
const createMembership = async (req, res) => {
  const { packageId } = req.body;
  try {
    const pkg = await Package.findById(packageId);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    const count = await Membership.countDocuments();
    const membershipId = `M${String(count + 1).padStart(3, '0')}`;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (pkg.durationMonths || 1));

    const membership = await Membership.create({
      membershipId,
      userId: req.user._id,
      packageId,
      startDate,
      endDate,
      paymentStatus: 'Pending',
    });

    res.status(201).json(membership);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get logged-in member's memberships
// @route GET /api/memberships/my
// @access Member
const getMyMemberships = async (req, res) => {
  try {
    const memberships = await Membership.find({ userId: req.user._id })
      .populate('packageId', 'planName price durationMonths')
      .sort({ createdAt: -1 });
    res.json(memberships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get all memberships (Admin)
// @route GET /api/memberships
// @access Admin
const getAllMemberships = async (req, res) => {
  try {
    const memberships = await Membership.find()
      .populate('userId', 'name email userId')
      .populate('packageId', 'planName price durationMonths')
      .sort({ createdAt: -1 });
    res.json(memberships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Approve payment (Admin)
// @route PUT /api/memberships/:id/approve
// @access Admin
const approveMembership = async (req, res) => {
  const { startDate, endDate } = req.body || {};
  try {
    const updateData = { paymentStatus: 'Paid' };
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);

    const membership = await Membership.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('userId', 'name email').populate('packageId', 'planName price planType');

    if (!membership) return res.status(404).json({ message: 'Membership not found' });
    res.json(membership);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Reject payment (Admin)
// @route PUT /api/memberships/:id/reject
// @access Admin
const rejectMembership = async (req, res) => {
  try {
    const membership = await Membership.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: 'Failed' },
      { new: true }
    );
    if (!membership) return res.status(404).json({ message: 'Membership not found' });
    res.json(membership);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Delete membership (Admin)
// @route DELETE /api/memberships/:id
// @access Admin
const deleteMembership = async (req, res) => {
  try {
    const membership = await Membership.findByIdAndDelete(req.params.id);
    if (!membership) return res.status(404).json({ message: 'Membership not found' });
    res.json({ message: 'Membership deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Admin manually create membership
// @route POST /api/memberships/admin
// @access Admin
const createMembershipAdmin = async (req, res) => {
  const { userId, packageId, startDate, endDate, paymentStatus } = req.body;
  try {
    const pkg = await Package.findById(packageId);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    const count = await Membership.countDocuments();
    const membershipId = `M${String(count + 1).padStart(3, '0')}`;

    const membership = await Membership.create({
      membershipId,
      userId,
      packageId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      paymentStatus: paymentStatus || 'Paid',
    });

    res.status(201).json(membership);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createMembership, createMembershipAdmin, getMyMemberships, getAllMemberships, approveMembership, rejectMembership, deleteMembership };
