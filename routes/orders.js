const express = require('express');
const prisma = require('../lib/prisma');
const verifyToken = require('../Middleware/auth');
const https = require('https');
const nodemailer = require('nodemailer');

// Optional auth: attaches req.user if token present, but never rejects
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const jwt = require('jsonwebtoken');
    try {
      req.user = jwt.verify(authHeader.replace('Bearer ', ''), process.env.JWT_SECRET || 'your-secret-key');
    } catch (_) {}
  }
  next();
}

const router = express.Router();

// Get orders for logged-in user
router.get('/user', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'user')
      return res.status(403).json({ success: false, message: 'Access denied' });
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching user orders' });
  }
});

// Get order by order number (public - for customer tracking)
router.get('/track/:orderNumber', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { orderNumber: req.params.orderNumber } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        items: order.items,
        createdAt: order.createdAt,
        customerName: order.customerInfo?.name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error tracking order' });
  }
});

// Get order statistics (admin only)
router.get('/admin/stats', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const { period = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const [totalOrders, recentOrdersCount, revenueAgg, statusGroups, recentRevenue] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: startDate } } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, _avg: { totalAmount: true } }),
      prisma.order.groupBy({ by: ['status'], _count: { id: true }, _sum: { totalAmount: true } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: startDate }, status: { notIn: ['cancelled'] } },
        _sum: { totalAmount: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        recentOrders: recentOrdersCount,
        totalRevenue: revenueAgg._sum.totalAmount || 0,
        recentRevenue: recentRevenue._sum.totalAmount || 0,
        averageOrderValue: revenueAgg._avg.totalAmount || 0,
        statusBreakdown: statusGroups.map(g => ({ status: g.status, count: g._count.id, revenue: g._sum.totalAmount || 0 })),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching order statistics' });
  }
});

// Check discount code validity (authenticated)
router.post('/check-discount', verifyToken, async (req, res) => {
  try {
    const { discountCode, totalAmount } = req.body;
    if (!discountCode) return res.status(400).json({ success: false, message: 'Discount code is required' });
    if (!totalAmount || totalAmount <= 0) return res.status(400).json({ success: false, message: 'Valid total amount is required' });

    const discount = await prisma.discountCode.findUnique({ where: { code: discountCode.toUpperCase().trim() } });
    if (!discount) return res.status(404).json({ success: false, message: 'Invalid discount code' });
    if (!discount.isActive) return res.status(400).json({ success: false, message: 'Discount code is not active' });
    if (discount.expiresAt && new Date() > discount.expiresAt) return res.status(400).json({ success: false, message: 'Discount code has expired' });

    if (req.user?.role === 'user') {
      const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { usedDiscountCodes: true } });
      if (user?.usedDiscountCodes.includes(discount.code))
        return res.status(400).json({ success: false, message: 'You have already used this discount code' });
    }

    const discountAmount = (totalAmount * discount.discount) / 100;
    const finalAmount = Math.max(0, totalAmount - discountAmount);

    res.json({
      success: true,
      message: 'Discount code is valid',
      data: {
        discountCode: discount.code,
        discountValue: discount.discount,
        discountAmount: discountAmount.toFixed(2),
        originalAmount: totalAmount.toFixed(2),
        finalAmount: finalAmount.toFixed(2),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error checking discount code' });
  }
});

// Create order — public (guest + logged-in users)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { customerInfo, items, notes, discountCode, deliveryFee = 0, paymentMethod = 'cod' } = req.body;

    if (!customerInfo || !customerInfo.name || !customerInfo.phone)
      return res.status(400).json({ success: false, message: 'Customer name and phone are required' });
    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });

    const validatedItems = [];
    let serverSubtotal = 0;

    for (const item of items) {
      if (!item.product || !item.quantity || item.quantity <= 0)
        return res.status(400).json({ success: false, message: 'Each item must have a valid product and quantity' });

      const product = await prisma.product.findUnique({ where: { id: item.product } });
      if (!product || !product.isActive)
        return res.status(400).json({ success: false, message: 'Product not found or inactive' });

      if (item.size && product.hasSizes) {
        const sizes = Array.isArray(product.sizes) ? product.sizes : [];
        const sizeEntry = sizes.find(s => s.size === item.size);
        if (!sizeEntry || sizeEntry.stock < item.quantity)
          return res.status(400).json({ success: false, message: `Insufficient stock for size ${item.size}` });
      } else if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.nameAr || product.name}` });
      }

      const unitPrice = product.priceAfterDiscount > 0 ? product.priceAfterDiscount : product.price;
      serverSubtotal += unitPrice * item.quantity;

      validatedItems.push({
        productId: product.id,
        name: product.name,
        nameAr: product.nameAr || product.name,
        image: Array.isArray(product.images) && product.images[0] ? product.images[0] : '',
        size: item.size || '',
        quantity: item.quantity,
        price: unitPrice,
      });
    }

    // Validate discount code if provided
    let discountAmount = 0;
    let appliedDiscountCode = null;
    if (discountCode) {
      const dc = await prisma.discountCode.findFirst({ where: { code: discountCode.toUpperCase(), isActive: true } });
      if (dc && (!dc.expiresAt || new Date() < dc.expiresAt)) {
        discountAmount = (serverSubtotal * dc.discount) / 100;
        appliedDiscountCode = dc.code;
        await prisma.discountCode.update({ where: { id: dc.id }, data: { usageCount: { increment: 1 } } });
      }
    }

    const VAT_RATE = 0.15;
    const computedDelivery = Number(deliveryFee) || 0;
    const vatBase = serverSubtotal - discountAmount + computedDelivery;
    const vat = vatBase * VAT_RATE;
    const totalAmount = vatBase + vat;

    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randPart = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `YS-${datePart}-${randPart}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: req.user?.role === 'user' ? req.user.id : null,
        customerInfo: {
          name: customerInfo.name.trim(),
          phone: customerInfo.phone.replace(/\s/g, ''),
          email: customerInfo.email?.trim().toLowerCase() || null,
          address: {
            street: customerInfo.address?.street || '',
            city: customerInfo.address?.city || '',
            region: customerInfo.address?.region || '',
          },
        },
        items: validatedItems,
        subtotal: serverSubtotal,
        discountCode: appliedDiscountCode,
        discountAmount,
        deliveryFee: computedDelivery,
        vat,
        totalAmount,
        paymentMethod,
        paymentStatus: 'pending',
        notes: notes?.trim() || '',
        status: 'pending',
      },
    });

    // Decrement stock
    for (const item of validatedItems) {
      if (item.size) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (product) {
          const sizes = Array.isArray(product.sizes) ? product.sizes : [];
          const updatedSizes = sizes.map(s =>
            s.size === item.size ? { ...s, stock: s.stock - item.quantity } : s
          );
          await prisma.product.update({ where: { id: item.productId }, data: { sizes: updatedSizes } });
        }
      } else {
        await prisma.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
      }
    }

    // Fire-and-forget notifications
    Promise.all([
      sendAdminNotification(order),
      order.customerInfo?.email ? sendCustomerConfirmation(order) : Promise.resolve(),
    ]).catch(err => console.error('Notification error:', err));

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderNumber: order.orderNumber,
        orderId: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error creating order' });
  }
});

// Get all orders (admin only)
router.get('/', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const { page = 1, limit = 20, status, search, startDate, endDate } = req.query;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerInfo: { path: ['name'], string_contains: search } },
        { customerInfo: { path: ['email'], string_contains: search } },
      ];
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total, statusGroups] = await Promise.all([
      prisma.order.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
      prisma.order.count({ where }),
      prisma.order.groupBy({ by: ['status'], _count: { id: true }, _sum: { totalAmount: true } }),
    ]);

    const pages = Math.ceil(total / Number(limit));
    res.json({
      success: true,
      data: orders,
      total,
      pages,
      pagination: { current: Number(page), pages, total, limit: Number(limit) },
      stats: statusGroups.map(g => ({ _id: g.status, count: g._count.id, totalAmount: g._sum.totalAmount || 0 })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching orders' });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching order' });
  }
});

// Update order status (admin only)
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status))
      return res.status(400).json({ success: false, message: `Invalid status. Valid: ${validStatuses.join(', ')}` });

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Restore stock when cancelling
    if (status === 'cancelled' && order.status !== 'cancelled') {
      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        if (!item.productId) continue;
        if (item.size) {
          const product = await prisma.product.findUnique({ where: { id: item.productId } });
          if (product) {
            const sizes = Array.isArray(product.sizes) ? product.sizes : [];
            const updatedSizes = sizes.map(s =>
              s.size === item.size ? { ...s, stock: s.stock + item.quantity } : s
            );
            await prisma.product.update({ where: { id: item.productId }, data: { sizes: updatedSizes } });
          }
        } else {
          await prisma.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } }).catch(() => {});
        }
      }
    }

    const updated = await prisma.order.update({ where: { id: req.params.id }, data: { status } });
    res.json({ success: true, message: 'Order status updated successfully', data: updated });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(500).json({ success: false, message: 'Error updating order status' });
  }
});

// Update order (admin only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const { customerInfo, status, notes } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const data = {};
    if (customerInfo) {
      const ci = order.customerInfo || {};
      data.customerInfo = {
        ...ci,
        ...(customerInfo.name && { name: customerInfo.name.trim() }),
        ...(customerInfo.email && { email: customerInfo.email.trim().toLowerCase() }),
        ...(customerInfo.phone && { phone: customerInfo.phone.trim() }),
        ...(customerInfo.address && { address: { ...(ci.address || {}), ...customerInfo.address } }),
      };
    }
    if (status) {
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status))
        return res.status(400).json({ success: false, message: 'Invalid status' });
      data.status = status;
    }
    if (notes !== undefined) data.notes = notes.trim();

    const updated = await prisma.order.update({ where: { id: req.params.id }, data });
    res.json({ success: true, message: 'Order updated successfully', data: updated });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(500).json({ success: false, message: 'Error updating order' });
  }
});

// Delete order (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.status !== 'cancelled') {
      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        if (item.productId) {
          await prisma.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } }).catch(() => {});
        }
      }
    }

    await prisma.order.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(500).json({ success: false, message: 'Error deleting order' });
  }
});

// ─── Notification Helpers ────────────────────────────────────────────────────

function getEmailTransporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  const encoded = encodeURIComponent(text);
  const path = `/bot${token}/sendMessage?chat_id=${chatId}&text=${encoded}&parse_mode=HTML`;
  return new Promise((resolve) => {
    const req = https.request({ hostname: 'api.telegram.org', port: 443, path, method: 'GET' }, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve(true));
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

function buildAdminEmailHtml(order) {
  const adminUrl = `${process.env.ADMIN_URL || 'http://localhost:3001'}/admin/orders/${order.id}`;
  const paymentLabels = { cod: '💵 كاش عند الاستلام', mada: '💳 مدى', stcpay: '📱 STC Pay', applepay: '🍎 Apple Pay', card: '💳 بطاقة ائتمان' };
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsRows = items.map(i =>
    `<tr>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0">${i.nameAr || i.name}</td>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:center">${i.size || '—'}</td>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:center">${i.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:right">${(i.price * i.quantity).toFixed(2)} ر.س</td>
    </tr>`
  ).join('');

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;direction:rtl">
  <div style="max-width:600px;margin:20px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 32px">
      <h1 style="color:white;margin:0;font-size:22px;font-weight:800">🛍 طلب جديد!</h1>
    </div>
    <div style="background:#fff7ed;border-bottom:2px solid #fed7aa;padding:16px 32px">
      <div style="font-size:22px;font-weight:900;color:#c2410c">${order.orderNumber}</div>
      <div style="font-size:13px;color:#7c2d12">${new Date(order.createdAt).toLocaleString('ar-SA')}</div>
    </div>
    <div style="padding:28px 32px">
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #e2e8f0">
        <h3 style="margin:0 0 14px;font-size:15px;color:#0f172a">👤 بيانات العميل</h3>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px">الاسم</td><td style="font-weight:600;font-size:13px">${order.customerInfo?.name}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px">الجوال</td><td style="font-weight:600;font-size:13px">${order.customerInfo?.phone}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px">المدينة</td><td style="font-weight:600;font-size:13px">${order.customerInfo?.address?.city || '—'}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px">الدفع</td><td style="font-weight:600;font-size:13px">${paymentLabels[order.paymentMethod] || order.paymentMethod}</td></tr>
        </table>
      </div>
      <div style="margin-bottom:20px">
        <h3 style="margin:0 0 12px;font-size:15px;color:#0f172a">📦 المنتجات</h3>
        <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0">
          <thead><tr style="background:#e2e8f0">
            <th style="padding:10px 8px;font-size:12px;color:#475569;text-align:right">المنتج</th>
            <th style="padding:10px 8px;font-size:12px;color:#475569;text-align:center">المقاس</th>
            <th style="padding:10px 8px;font-size:12px;color:#475569;text-align:center">الكمية</th>
            <th style="padding:10px 8px;font-size:12px;color:#475569;text-align:right">الإجمالي</th>
          </tr></thead>
          <tbody>${itemsRows}</tbody>
        </table>
      </div>
      <div style="background:#f8fafc;border-radius:12px;padding:20px;border:1px solid #e2e8f0;margin-bottom:24px">
        <table style="width:100%">
          <tr><td style="padding:5px 0;color:#64748b;font-size:13px">المجموع الفرعي</td><td style="font-size:13px;text-align:left">${(order.subtotal||0).toFixed(2)} ر.س</td></tr>
          ${(order.discountAmount||0) > 0 ? `<tr><td style="color:#16a34a;font-size:13px">خصم (${order.discountCode})</td><td style="color:#16a34a;font-size:13px;text-align:left">-${(order.discountAmount).toFixed(2)} ر.س</td></tr>` : ''}
          <tr><td style="padding:5px 0;color:#64748b;font-size:13px">ضريبة 15%</td><td style="font-size:13px;text-align:left">${(order.vat||0).toFixed(2)} ر.س</td></tr>
          <tr style="border-top:2px solid #e2e8f0">
            <td style="padding:12px 0 5px;font-size:16px;font-weight:800;color:#0f172a">الإجمالي</td>
            <td style="font-size:18px;font-weight:900;color:#ea580c;text-align:left">${(order.totalAmount||0).toFixed(2)} ر.س</td>
          </tr>
        </table>
      </div>
      <div style="text-align:center">
        <a href="${adminUrl}" style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);color:white;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:800;font-size:15px">عرض الطلب في لوحة الإدارة ←</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function buildCustomerEmailHtml(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsRows = items.map(i =>
    `<tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0">${i.nameAr || i.name}${i.size ? ` (${i.size})` : ''}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:center">${i.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right">${(i.price * i.quantity).toFixed(2)} ر.س</td>
    </tr>`
  ).join('');

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;direction:rtl">
  <div style="max-width:600px;margin:20px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:32px;text-align:center">
      <h1 style="color:white;margin:0 0 6px;font-size:26px;font-weight:900">شكراً لك! 🎉</h1>
      <p style="color:rgba(255,255,255,.9);margin:0;font-size:15px">تم استلام طلبك بنجاح</p>
    </div>
    <div style="background:#fff7ed;border-bottom:2px solid #fed7aa;padding:20px 32px;text-align:center">
      <p style="margin:0 0 4px;font-size:13px;color:#9a3412">رقم طلبك</p>
      <div style="font-size:28px;font-weight:900;color:#c2410c;letter-spacing:2px">${order.orderNumber}</div>
    </div>
    <div style="padding:28px 32px">
      <p style="color:#374151;line-height:1.7;margin-top:0">مرحباً <strong>${order.customerInfo?.name}</strong>،<br>لقد تلقينا طلبك وسيتم التواصل معك قريباً.</p>
      <h3 style="margin:20px 0 12px;font-size:15px;color:#0f172a">📦 تفاصيل طلبك</h3>
      <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0">
        <thead><tr style="background:#e2e8f0">
          <th style="padding:10px 8px;font-size:12px;color:#475569;text-align:right">المنتج</th>
          <th style="padding:10px 8px;font-size:12px;color:#475569;text-align:center">الكمية</th>
          <th style="padding:10px 8px;font-size:12px;color:#475569;text-align:right">الإجمالي</th>
        </tr></thead>
        <tbody>${itemsRows}</tbody>
      </table>
      <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;margin-top:16px;border:1px solid #e2e8f0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:16px;font-weight:800;color:#0f172a">الإجمالي مع الضريبة</span>
          <span style="font-size:22px;font-weight:900;color:#ea580c">${(order.totalAmount||0).toFixed(2)} ر.س</span>
        </div>
        ${order.paymentMethod === 'cod' ? '<p style="margin:8px 0 0;font-size:13px;color:#6b7280">💵 الدفع عند الاستلام</p>' : ''}
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function sendAdminNotification(order) {
  const adminUrl = `${process.env.ADMIN_URL || 'http://localhost:3000'}/admin/orders/${order.id}`;
  const paymentLabels = { cod: 'كاش', mada: 'مدى', stcpay: 'STC Pay', applepay: 'Apple Pay' };
  const items = Array.isArray(order.items) ? order.items : [];

  const tgText = [
    `🛍 <b>طلب جديد!</b>`,
    `📋 رقم الطلب: <b>${order.orderNumber}</b>`,
    `👤 العميل: ${order.customerInfo?.name}`,
    `📱 الجوال: ${order.customerInfo?.phone}`,
    `📍 ${order.customerInfo?.address?.region || ''} - ${order.customerInfo?.address?.city || ''}`,
    `💳 الدفع: ${paymentLabels[order.paymentMethod] || order.paymentMethod}`,
    `📦 المنتجات: ${items.length} قطعة`,
    `💰 الإجمالي: <b>${(order.totalAmount||0).toFixed(2)} ر.س</b>`,
    `🔗 ${adminUrl}`,
  ].join('\n');

  const tgOk = await sendTelegramMessage(tgText);

  const transporter = getEmailTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `يلا سبورت <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
        subject: `🛍 طلب جديد ${order.orderNumber} — ${(order.totalAmount||0).toFixed(2)} ر.س`,
        html: buildAdminEmailHtml(order),
      });
    } catch (err) {
      console.error('Admin email error:', err.message);
    }
  }

  return tgOk;
}

async function sendCustomerConfirmation(order) {
  const transporter = getEmailTransporter();
  if (!transporter || !order.customerInfo?.email) return;
  try {
    await transporter.sendMail({
      from: `يلا سبورت <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: order.customerInfo.email,
      subject: `✅ تم استلام طلبك ${order.orderNumber} — يلا سبورت`,
      html: buildCustomerEmailHtml(order),
    });
  } catch (err) {
    console.error('Customer email error:', err.message);
  }
}

module.exports = router;
