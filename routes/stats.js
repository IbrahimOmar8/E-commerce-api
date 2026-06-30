const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const verifyToken = require('../Middleware/auth');

const router = express.Router();

// GET dashboard stats (admin only)
router.get('/', verifyToken, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalOrders,
      monthOrders,
      lastMonthOrders,
      revenueAgg,
      monthRevenueAgg,
      lastMonthRevenueAgg,
      totalProducts,
      activeProducts,
      totalUsers,
      pendingOrders,
      recentOrders,
      ordersByStatus,
      topProducts,
      salesByDay
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),

      Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.aggregate([{ $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.aggregate([{ $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),

      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      User.countDocuments(),
      Order.countDocuments({ status: 'pending' }),

      Order.find().sort({ createdAt: -1 }).limit(10)
        .select('orderNumber customerInfo.name totalAmount status createdAt paymentMethod'),

      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }, name: { $first: '$items.name' } } },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'productInfo' } }
      ]),

      Order.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, status: { $ne: 'cancelled' } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const monthRevenue = monthRevenueAgg[0]?.total || 0;
    const lastMonthRevenue = lastMonthRevenueAgg[0]?.total || 0;
    const revenueGrowth = lastMonthRevenue > 0 ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) : 0;
    const ordersGrowth = lastMonthOrders > 0 ? ((monthOrders - lastMonthOrders) / lastMonthOrders * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalOrders,
          monthOrders,
          ordersGrowth: Number(ordersGrowth),
          totalRevenue,
          monthRevenue,
          revenueGrowth: Number(revenueGrowth),
          totalProducts,
          activeProducts,
          totalUsers,
          pendingOrders
        },
        recentOrders,
        ordersByStatus,
        topProducts,
        salesByDay
      }
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
