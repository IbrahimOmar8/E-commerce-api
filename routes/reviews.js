const express = require('express');
const prisma = require('../lib/prisma');
const verifyToken = require('../Middleware/auth');

const router = express.Router();

// Get ALL reviews (admin)
router.get('/', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });
    const { page = 1, limit = 20, isApproved } = req.query;
    const where = {};
    if (isApproved !== undefined) where.isApproved = isApproved === 'true';
    const skip = (Number(page) - 1) * Number(limit);
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where, skip, take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { username: true, fullName: true } },
          product: { select: { name: true, nameAr: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);
    res.json({ success: true, data: reviews, total, pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching reviews' });
  }
});

// Approve / reject review (admin)
router.patch('/:id/approve', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });
    const { isApproved } = req.body;
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { isApproved: Boolean(isApproved) },
    });
    // Recalculate rating
    const agg = await prisma.review.aggregate({ where: { productId: review.productId, isApproved: true }, _avg: { rating: true }, _count: true });
    await prisma.product.update({ where: { id: review.productId }, data: { averageRating: agg._avg.rating || 0, totalReviews: agg._count } });
    res.json({ success: true, data: review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error updating review' });
  }
});

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: req.params.productId, isApproved: true },
      include: { user: { select: { username: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching reviews' });
  }
});

// Create review (authenticated user)
router.post('/', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'user')
      return res.status(403).json({ success: false, message: 'Access denied' });

    const { productId, rating, comment } = req.body;
    if (!productId || !rating) return res.status(400).json({ success: false, message: 'productId and rating are required' });
    if (rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating must be 1-5' });

    const review = await prisma.review.create({
      data: { productId, userId: req.user.id, rating: Number(rating), comment },
      include: { user: { select: { username: true, fullName: true } } },
    });

    // Recalculate product average rating
    const agg = await prisma.review.aggregate({ where: { productId, isApproved: true }, _avg: { rating: true }, _count: true });
    await prisma.product.update({
      where: { id: productId },
      data: { averageRating: agg._avg.rating || 0, totalReviews: agg._count },
    });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(400).json({ success: false, message: 'You already reviewed this product' });
    res.status(500).json({ success: false, message: 'Error creating review' });
  }
});

// Delete review (admin or owner)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super-admin';
    if (!isAdmin && review.userId !== req.user.id)
      return res.status(403).json({ success: false, message: 'Access denied' });

    await prisma.review.delete({ where: { id: req.params.id } });

    const agg = await prisma.review.aggregate({ where: { productId: review.productId, isApproved: true }, _avg: { rating: true }, _count: true });
    await prisma.product.update({
      where: { id: review.productId },
      data: { averageRating: agg._avg.rating || 0, totalReviews: agg._count },
    });

    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error deleting review' });
  }
});

module.exports = router;
