const Package = require('../models/Package');
const fs = require('fs');
const path = require('path');

const DURATION_MAP = { Monthly: 1, Quarterly: 3, Annually: 12 };

const buildFileUrl = (req, filePath) =>
  filePath ? `${req.protocol}://${req.get('host')}/${filePath.replace(/\\/g, '/')}` : null;

// GET all packages
const getPackages = async (req, res) => {
  try {
    const packages = await Package.find({}).sort({ durationMonths: 1 });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE package (Admin)
const createPackage = async (req, res) => {
  const { planName, planType, price, benefits, badge, notes } = req.body;
  try {
    const count = await Package.countDocuments();
    const packageId = `P${String(count + 1).padStart(3, '0')}`;
    const durationMonths = DURATION_MAP[planType] || 1;
    const imageUrl = req.file ? buildFileUrl(req, req.file.path) : null;
    const pkg = await Package.create({
      packageId, planName, planType, price, durationMonths,
      benefits: benefits || [], badge, notes, imageUrl,
    });
    res.status(201).json(pkg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE package (Admin)
const updatePackage = async (req, res) => {
  const { planName, planType, price, benefits, badge, notes } = req.body;
  try {
    const durationMonths = DURATION_MAP[planType] || 1;
    const existing = await Package.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Package not found' });

    const updateData = { planName, planType, price, durationMonths, benefits, badge, notes };
    if (req.file) {
      // Remove old image if exists
      if (existing.imageUrl) {
        const oldPath = existing.imageUrl.split('/uploads/')[1];
        if (oldPath) fs.unlink(path.join('uploads', oldPath), () => {});
      }
      updateData.imageUrl = buildFileUrl(req, req.file.path);
    }

    const pkg = await Package.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE package (Admin)
const deletePackage = async (req, res) => {
  try {
    const pkg = await Package.findByIdAndDelete(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    res.json({ message: 'Package deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPackages, createPackage, updatePackage, deletePackage };
