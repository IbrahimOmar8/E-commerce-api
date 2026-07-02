const express = require('express');
const prisma = require('../lib/prisma');
const verifyToken = require('../Middleware/auth');

const router = express.Router();

// Get wishlist for logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'user')
      return res.status(403).json({ success: false, message: 'Access denied' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const products = user.wishlist.length
      ? await prisma.product.findMany({ where: { id: { in: user.wishlist }, isActive: true }, include: { brand: true } })
      : [];

    res.json({ success: true, data: products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching wishlist' });
  }
});

// Add to wishlist
router.post('/:productId', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'user')
      return res.status(403).json({ success: false, message: 'Access denied' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.wishlist.includes(req.params.productId))
      return res.json({ success: true, message: 'Already in wishlist' });

    await prisma.user.update({
      where: { id: req.user.id },
      data: { wishlist: { push: req.params.productId } },
    });
    res.json({ success: true, message: 'Added to wishlist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error adding to wishlist' });
  }
});

// Remove from wishlist
router.delete('/:productId', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'user')
      return res.status(403).json({ success: false, message: 'Access denied' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    await prisma.user.update({
      where: { id: req.user.id },
      data: { wishlist: user.wishlist.filter(id => id !== req.params.productId) },
    });
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error removing from wishlist' });
  }
});

module.exports = router;
