const express = require('express');
const prisma = require('../lib/prisma');
const verifyToken = require('../Middleware/auth');

const router = express.Router();

// Validate discount code — public (used from cart/checkout)
router.post('/validate', async (req, res) => {
  try {
    const { code, total } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Code is required' });
    if (!total || total <= 0) return res.status(400).json({ success: false, message: 'Valid total is required' });

    const dc = await prisma.discountCode.findUnique({ where: { code: code.toUpperCase().trim() } });
    if (!dc) return res.status(404).json({ success: false, message: 'Invalid discount code' });
    if (!dc.isActive) return res.status(400).json({ success: false, message: 'Discount code is not active' });
    if (dc.expiresAt && new Date() > dc.expiresAt) return res.status(400).json({ success: false, message: 'Discount code has expired' });

    const discountAmount = (total * dc.discount) / 100;
    res.json({ success: true, discount: dc.discount, discountAmount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error validating discount code' });
  }
});

// List all (admin)
router.get('/', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });
    const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: codes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching discount codes' });
  }
});

// Create (admin)
router.post('/', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });
    const { code, discount, expiresAt, isActive } = req.body;
    const dc = await prisma.discountCode.create({
      data: { code: code.toUpperCase(), discount: Number(discount), expiresAt: expiresAt ? new Date(expiresAt) : null, isActive: isActive !== false },
    });
    res.status(201).json({ success: true, data: dc });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(400).json({ success: false, message: 'Code already exists' });
    res.status(500).json({ success: false, message: 'Error creating discount code' });
  }
});

// Update (admin)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });
    const { code, discount, expiresAt, isActive } = req.body;
    const dc = await prisma.discountCode.update({
      where: { id: req.params.id },
      data: { code: code?.toUpperCase(), discount: discount ? Number(discount) : undefined, expiresAt: expiresAt ? new Date(expiresAt) : undefined, isActive },
    });
    res.json({ success: true, data: dc });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Not found' });
    res.status(500).json({ success: false, message: 'Error updating discount code' });
  }
});

// Delete (admin)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });
    await prisma.discountCode.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Discount code deleted' });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Not found' });
    res.status(500).json({ success: false, message: 'Error deleting discount code' });
  }
});

module.exports = router;
