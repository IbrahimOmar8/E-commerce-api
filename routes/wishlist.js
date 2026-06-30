const express = require('express');
const User = require('../models/User');
const verifyToken = require('../Middleware/auth');

const router = express.Router();

// GET user wishlist
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'wishlist',
      select: 'name nameAr price priceAfterDiscount discount images averageRating totalReviews isActive',
      match: { isActive: true }
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user.wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST toggle product in wishlist
router.post('/toggle', verifyToken, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'productId is required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const index = user.wishlist.indexOf(productId);
    let added;
    if (index === -1) {
      user.wishlist.push(productId);
      added = true;
    } else {
      user.wishlist.splice(index, 1);
      added = false;
    }
    await user.save();

    res.json({ success: true, added, wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
