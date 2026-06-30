const express = require('express');
const Review = require('../models/Review');
const Product = require('../models/Product');
const verifyToken = require('../Middleware/auth');

const router = express.Router();

// GET reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      Review.find({ product: req.params.productId, isApproved: true })
        .populate('user', 'fullName username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments({ product: req.params.productId, isApproved: true })
    ]);

    res.json({ success: true, data: reviews, total, pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create review (user)
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Only users can leave reviews' });
    }

    const { product, rating, comment } = req.body;
    if (!product || !rating) {
      return res.status(400).json({ success: false, message: 'Product and rating are required' });
    }

    const existing = await Review.findOne({ product, user: req.user.id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already reviewed this product' });
    }

    const review = new Review({ product, user: req.user.id, rating, comment });
    await review.save();

    // Update product average rating
    const stats = await Review.aggregate([
      { $match: { product: review.product, isApproved: true } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(product, {
        averageRating: Math.round(stats[0].avgRating * 10) / 10,
        totalReviews: stats[0].count
      });
    }

    await review.populate('user', 'fullName username');
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'You already reviewed this product' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE review (admin)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    // Recalculate product rating
    const stats = await Review.aggregate([
      { $match: { product: review.product, isApproved: true } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    await Product.findByIdAndUpdate(review.product, {
      averageRating: stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0,
      totalReviews: stats.length > 0 ? stats[0].count : 0
    });

    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
