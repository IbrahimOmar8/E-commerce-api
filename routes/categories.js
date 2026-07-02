const express = require('express');
const prisma = require('../lib/prisma');
const verifyToken = require('../Middleware/auth');

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const { isActive, parent } = req.query;
    const where = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (parent === 'null' || parent === '') where.parentId = null;
    else if (parent) where.parentId = parent;

    const categories = await prisma.category.findMany({
      where,
      include: { children: true, parent: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching categories' });
  }
});

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const cat = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { children: true, parent: true },
    });
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: cat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching category' });
  }
});

// Create category (admin)
router.post('/', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const { name, description, image, isActive, parentId } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });

    let ancestors = [];
    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (parent) ancestors = [...parent.ancestors, parentId];
    }

    const cat = await prisma.category.create({
      data: { name, description, image: image || '', isActive: isActive !== false, parentId: parentId || null, ancestors },
    });
    res.status(201).json({ success: true, data: cat });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(400).json({ success: false, message: 'Category name already exists' });
    res.status(500).json({ success: false, message: 'Error creating category' });
  }
});

// Update category (admin)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const { name, description, image, isActive, parentId } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (image !== undefined) data.image = image;
    if (isActive !== undefined) data.isActive = isActive;
    if (parentId !== undefined) {
      data.parentId = parentId || null;
      if (parentId) {
        const parent = await prisma.category.findUnique({ where: { id: parentId } });
        data.ancestors = parent ? [...parent.ancestors, parentId] : [];
      } else {
        data.ancestors = [];
      }
    }

    const cat = await prisma.category.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: cat });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(500).json({ success: false, message: 'Error updating category' });
  }
});

// Delete category (admin)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });

    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(500).json({ success: false, message: 'Error deleting category' });
  }
});

module.exports = router;
