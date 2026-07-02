const express = require('express');
const prisma = require('../lib/prisma');
const verifyToken = require('../Middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const [totalOrders, totalProducts, totalUsers, totalCategories, totalBrands, revenueAgg, pendingOrders, recentOrders] = await Promise.all([
      prisma.order.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.brand.count({ where: { isActive: true } }),
      prisma.order.aggregate({ where: { status: { notIn: ['cancelled'] } }, _sum: { totalAmount: true }, _avg: { totalAmount: true } }),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.findMany({ take: 10, orderBy: { createdAt: 'desc' }, select: { id: true, orderNumber: true, customerInfo: true, totalAmount: true, status: true, createdAt: true } }),
    ]);

    // Status breakdown
    const statusGroups = await prisma.order.groupBy({ by: ['status'], _count: true, _sum: { totalAmount: true } });

    // Revenue last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRevenue = await prisma.order.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo }, status: { notIn: ['cancelled'] } },
      _sum: { totalAmount: true },
    });

    res.json({
      success: true,
      data: {
        totalOrders, totalProducts, totalUsers, totalCategories, totalBrands,
        totalRevenue: revenueAgg._sum.totalAmount || 0,
        averageOrderValue: revenueAgg._avg.totalAmount || 0,
        recentRevenue: recentRevenue._sum.totalAmount || 0,
        pendingOrders,
        statusBreakdown: statusGroups.map(g => ({ status: g.status, count: g._count, revenue: g._sum.totalAmount || 0 })),
        recentOrders,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
});

module.exports = router;
