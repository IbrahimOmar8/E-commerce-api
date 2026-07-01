const express = require('express');
const DiscountCode = require('../models/DiscountCode');
const verifyToken = require('../Middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: DiscountCodes
 *   description: Discount code management (admin only)
 */

/**
 * @swagger
 * /discount-codes:
 *   get:
 *     summary: Get all discount codes
 *     tags: [DiscountCodes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of discount codes
 *   post:
 *     summary: Create a discount code
 *     tags: [DiscountCodes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               discount:
 *                 type: number
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Discount code created
 */

/**
 * @swagger
 * /discount-codes/{id}:
 *   get:
 *     summary: Get discount code by ID
 *     tags: [DiscountCodes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Discount code object
 *   put:
 *     summary: Update discount code by ID
 *     tags: [DiscountCodes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               discount:
 *                 type: number
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Discount code updated
 *   delete:
 *     summary: Delete discount code by ID
 *     tags: [DiscountCodes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Discount code deleted
 */

// Validate discount code — public (used from cart/checkout)
router.post('/validate', async (req, res) => {
  try {
    const { code, total } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Code is required' });
    if (!total || total <= 0) return res.status(400).json({ success: false, message: 'Valid total is required' });

    const dc = await DiscountCode.findOne({ code: code.toUpperCase().trim() });
    if (!dc) return res.status(404).json({ success: false, message: 'Invalid discount code' });
    if (!dc.isActive) return res.status(400).json({ success: false, message: 'Discount code is not active' });
    if (dc.expiresAt && new Date() > dc.expiresAt) return res.status(400).json({ success: false, message: 'Discount code has expired' });

    const discountAmount = (total * dc.discount) / 100;
    res.json({ success: true, discount: dc.discount, discountAmount });
  } catch (err) {
    console.error('Validate discount error:', err);
    res.status(500).json({ success: false, message: 'Error validating discount code' });
  }
});

// List all discount codes (admin only)
router.get('/', verifyToken, async (req, res) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin')) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  const codes = await DiscountCode.find();
  res.json({ success: true, data: codes });
});

// Create discount code (admin only)
router.post('/', verifyToken, async (req, res) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin')) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  const { code, discount, expiresAt } = req.body;
  const newCode = new DiscountCode({ code, discount, expiresAt });
  await newCode.save();
  res.status(201).json({ success: true, data: newCode });
});

// Get discount code by ID (admin only)
router.get('/:id', verifyToken, async (req, res) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin')) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  const code = await DiscountCode.findById(req.params.id);
  if (!code) return res.status(404).json({ success: false, message: 'Discount code not found' });
  res.json({ success: true, data: code });
});

// Update discount code by ID (admin only)
router.put('/:id', verifyToken, async (req, res) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin')) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  const { code, discount, expiresAt } = req.body;
  const updated = await DiscountCode.findByIdAndUpdate(
    req.params.id,
    { code, discount, expiresAt },
    { new: true }
  );
  if (!updated) return res.status(404).json({ success: false, message: 'Discount code not found' });
  res.json({ success: true, data: updated });
});

// Delete discount code by ID (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin')) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  await DiscountCode.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Discount code deleted' });
});

module.exports = router;
