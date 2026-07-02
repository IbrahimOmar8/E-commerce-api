const express = require('express');
const prisma = require('../lib/prisma');
const verifyToken = require('../Middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { isActive } = req.query;
    const where = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    const brands = await prisma.brand.findMany({ where, orderBy: { name: 'asc' } });
    res.json({ success: true, data: brands });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching brands' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const brand = await prisma.brand.findUnique({ where: { id: req.params.id } });
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
    res.json({ success: true, data: brand });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching brand' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const { name, nameAr, logo, description, descriptionAr, isActive } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Brand name is required' });

    const brand = await prisma.brand.create({
      data: { name, nameAr, logo: logo || '', description, descriptionAr, isActive: isActive !== false },
    });
    res.status(201).json({ success: true, data: brand });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(400).json({ success: false, message: 'Brand name already exists' });
    res.status(500).json({ success: false, message: 'Error creating brand' });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const { name, nameAr, logo, description, descriptionAr, isActive } = req.body;
    const brand = await prisma.brand.update({
      where: { id: req.params.id },
      data: { name, nameAr, logo, description, descriptionAr, isActive },
    });
    res.json({ success: true, data: brand });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Brand not found' });
    res.status(500).json({ success: false, message: 'Error updating brand' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });

    await prisma.brand.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Brand deleted' });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Brand not found' });
    res.status(500).json({ success: false, message: 'Error deleting brand' });
  }
});

module.exports = router;
