const express = require('express');
const Brand = require('../models/Brand');
const verifyToken = require('../Middleware/auth');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * tags:
 *   name: Brands
 *   description: Brand management
 */

// GET all brands
router.get('/', async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    else filter.isActive = true;

    const brands = await Brand.find(filter).sort({ name: 1 });
    res.json({ success: true, data: brands });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single brand
router.get('/:id', async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
    res.json({ success: true, data: brand });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create brand (admin)
router.post('/', verifyToken, async (req, res) => {
  try {
    const brand = new Brand(req.body);
    await brand.save();
    res.status(201).json({ success: true, data: brand });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Brand name already exists' });
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update brand (admin)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
    res.json({ success: true, data: brand });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE brand (admin)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
    res.json({ success: true, message: 'Brand deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST upload brand logo
router.post('/:id/logo', verifyToken, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'yalla-sport/brands', transformation: [{ width: 300, height: 300, crop: 'pad', background: 'white' }] },
        (error, result) => { if (error) reject(error); else resolve(result); }
      ).end(req.file.buffer);
    });

    const brand = await Brand.findByIdAndUpdate(req.params.id, { logo: result.secure_url }, { new: true });
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });

    res.json({ success: true, data: brand });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
