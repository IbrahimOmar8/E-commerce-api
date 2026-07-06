const express = require('express');
const prisma = require('../lib/prisma');
const verifyToken = require('../Middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { isActive } = req.query;
    const where = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    const sports = await prisma.sport.findMany({ where, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    res.json({ success: true, data: sports });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching sports' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const sport = await prisma.sport.findUnique({ where: { id: req.params.id } });
    if (!sport) return res.status(404).json({ success: false, message: 'Sport not found' });
    res.json({ success: true, data: sport });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching sport' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const { name, nameAr, icon, isActive, sortOrder } = req.body;
    if (!name || !nameAr) return res.status(400).json({ success: false, message: 'name and nameAr are required' });

    const sport = await prisma.sport.create({
      data: { name, nameAr, icon: icon || '🏃', isActive: isActive !== false, sortOrder: Number(sortOrder || 0) },
    });
    res.status(201).json({ success: true, data: sport });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(400).json({ success: false, message: 'Sport name already exists' });
    res.status(500).json({ success: false, message: 'Error creating sport' });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const { name, nameAr, icon, isActive, sortOrder } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (nameAr !== undefined) data.nameAr = nameAr;
    if (icon !== undefined) data.icon = icon;
    if (isActive !== undefined) data.isActive = isActive;
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);

    const sport = await prisma.sport.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: sport });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Sport not found' });
    res.status(500).json({ success: false, message: 'Error updating sport' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });

    await prisma.sport.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Sport deleted' });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Sport not found' });
    res.status(500).json({ success: false, message: 'Error deleting sport' });
  }
});

module.exports = router;
