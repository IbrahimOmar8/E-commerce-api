const express = require('express');
const prisma = require('../lib/prisma');
const verifyToken = require('../Middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalOrders,
      monthOrders,
      lastMonthOrders,
      totalProducts,
      activeProducts,
      totalUsers,
      pendingOrders,
      totalRevenueAgg,
      monthRevenueAgg,
      lastMonthRevenueAgg,
      recentOrders,
      ordersByStatus,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: thisMonthStart } } }),
      prisma.order.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.aggregate({ where: { status: { notIn: ['cancelled'] } }, _sum: { totalAmount: true } }),
      prisma.order.aggregate({ where: { status: { notIn: ['cancelled'] }, createdAt: { gte: thisMonthStart } }, _sum: { totalAmount: true } }),
      prisma.order.aggregate({ where: { status: { notIn: ['cancelled'] }, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } }, _sum: { totalAmount: true } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, orderNumber: true, customerInfo: true,
          totalAmount: true, status: true, createdAt: true,
          paymentMethod: true, paymentStatus: true, items: true,
          subtotal: true, discountCode: true, discountAmount: true,
          deliveryFee: true, vat: true, notes: true, updatedAt: true,
        },
      }),
      prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    const monthRev = monthRevenueAgg._sum.totalAmount || 0;
    const lastMonthRev = lastMonthRevenueAgg._sum.totalAmount || 0;
    const revenueGrowth = lastMonthRev > 0
      ? Math.round(((monthRev - lastMonthRev) / lastMonthRev) * 100) : 0;
    const ordersGrowth = lastMonthOrders > 0
      ? Math.round(((monthOrders - lastMonthOrders) / lastMonthOrders) * 100) : 0;

    // Top products — aggregate sold quantities from order items JSON
    const allOrderItems = await prisma.order.findMany({
      where: { status: { notIn: ['cancelled'] } },
      select: { items: true },
    });
    const productSales = {};
    for (const order of allOrderItems) {
      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        const pid = item.productId;
        if (!pid) continue;
        if (!productSales[pid]) productSales[pid] = { id: pid, name: item.name || '', totalSold: 0, revenue: 0 };
        productSales[pid].totalSold += item.quantity || 0;
        productSales[pid].revenue += (item.price || 0) * (item.quantity || 0);
      }
    }
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5)
      .map(p => ({ _id: p.id, name: p.name, totalSold: p.totalSold, revenue: p.revenue }));

    // Sales by day — last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentForDays = await prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo }, status: { notIn: ['cancelled'] } },
      select: { createdAt: true, totalAmount: true },
    });
    const dayMap = {};
    for (const o of recentForDays) {
      const day = o.createdAt.toISOString().split('T')[0];
      if (!dayMap[day]) dayMap[day] = { orders: 0, revenue: 0 };
      dayMap[day].orders++;
      dayMap[day].revenue += o.totalAmount || 0;
    }
    const salesByDay = Object.entries(dayMap)
      .map(([date, vals]) => ({ _id: date, ...vals }))
      .sort((a, b) => a._id.localeCompare(b._id));

    res.json({
      success: true,
      data: {
        overview: {
          totalOrders,
          monthOrders,
          ordersGrowth,
          totalRevenue: totalRevenueAgg._sum.totalAmount || 0,
          monthRevenue: monthRev,
          revenueGrowth,
          totalProducts,
          activeProducts,
          totalUsers,
          pendingOrders,
        },
        recentOrders,
        ordersByStatus: ordersByStatus.map(s => ({ _id: s.status, count: s._count._all })),
        topProducts,
        salesByDay,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
});

module.exports = router;
