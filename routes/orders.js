const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const DiscountCode = require('../models/DiscountCode');

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
    } catch (_) { /* ignore invalid token */ }
  }
  next();
}

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: API for managing orders
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders (admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by order status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by customer name, email, or order number
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: -createdAt
 *     responses:
 *       200:
 *         description: List of orders
 *
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerInfo:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: John Doe
 *                   email:
 *                     type: string
 *                     example: john@example.com
 *                   phone:
 *                     type: string
 *                     example: +1234567890
 *                   address:
 *                     type: object
 *                     properties:
 *                       street:
 *                         type: string
 *                         example: 123 Main St
 *                       city:
 *                         type: string
 *                         example: New York
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                       example: 64b7f3c2e4b0f5a1c2d3e4f5
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *               notes:
 *                 type: string
 *                 example: Please deliver after 5 PM
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderNumber:
 *                       type: string
 *                       example: ORD123456
 *                     totalAmount:
 *                       type: number
 *                       example: 199.98
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get single order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order object
 *       404:
 *         description: Not found
 *
 *   put:
 *     summary: Update order (admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *
 *   delete:
 *     summary: Delete order (admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */

/**
 * @swagger
 * /orders/track/{orderNumber}:
 *   get:
 *     summary: Track order by order number (public)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order status
 */

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status (admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: confirmed
 *     responses:
 *       200:
 *         description: Status updated
 */

/**
 * @swagger
 * /orders/admin/stats:
 *   get:
 *     summary: Get order statistics (admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics object
 */

/**
 * @swagger
 * /orders/user:
 *   get:
 *     summary: Get orders for the logged-in user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 * 
 * 
 */

/**
 * @swagger
 * /orders/check-discount:
 *   post:
 *     summary: Check discount code validity
 *     description: Validate a discount code and calculate potential discount amount
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - discountCode
 *               - totalAmount
 *             properties:
 *               discountCode:
 *                 type: string
 *                 description: Discount code to validate
 *                 example: "SAVE20"
 *               totalAmount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Order subtotal amount to apply discount on
 *                 example: 100.00
 *           examples:
 *             percentage_discount:
 *               summary: Check percentage discount
 *               value:
 *                 discountCode: "SAVE20"
 *                 totalAmount: 100.00
 *             fixed_discount:
 *               summary: Check fixed discount
 *               value:
 *                 discountCode: "GET10OFF"
 *                 totalAmount: 50.00
 *     responses:
 *       200:
 *         description: Discount code is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Discount code is valid"
 *                 data:
 *                   type: object
 *                   properties:
 *                     discountCode:
 *                       type: string
 *                       example: "SAVE20"
 *                       description: Applied discount code
 *                     discountType:
 *                       type: string
 *                       enum: [percentage, fixed]
 *                       example: "percentage"
 *                       description: Type of discount
 *                     discountValue:
 *                       type: number
 *                       example: 20
 *                       description: Discount value (percentage or fixed amount)
 *                     discountAmount:
 *                       type: string
 *                       example: "20.00"
 *                       description: Calculated discount amount
 *                     originalAmount:
 *                       type: string
 *                       example: "100.00"
 *                       description: Original amount before discount
 *                     finalAmount:
 *                       type: string
 *                       example: "80.00"
 *                       description: Final amount after discount
 *                     description:
 *                       type: string
 *                       example: "Save 20% on your order"
 *                       description: Discount description
 *             examples:
 *               percentage_discount_response:
 *                 summary: Valid percentage discount
 *                 value:
 *                   success: true
 *                   message: "Discount code is valid"
 *                   data:
 *                     discountCode: "SAVE20"
 *                     discountType: "percentage"
 *                     discountValue: 20
 *                     discountAmount: "20.00"
 *                     originalAmount: "100.00"
 *                     finalAmount: "80.00"
 *                     description: "Save 20% on your order"
 *               fixed_discount_response:
 *                 summary: Valid fixed discount
 *                 value:
 *                   success: true
 *                   message: "Discount code is valid"
 *                   data:
 *                     discountCode: "GET10OFF"
 *                     discountType: "fixed"
 *                     discountValue: 10
 *                     discountAmount: "10.00"
 *                     originalAmount: "50.00"
 *                     finalAmount: "40.00"
 *                     description: "Get $10 off your order"
 *       400:
 *         description: Bad request - validation errors or invalid discount code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *             examples:
 *               missing_code:
 *                 summary: Missing discount code
 *                 value:
 *                   success: false
 *                   message: "Discount code is required"
 *               missing_amount:
 *                 summary: Missing total amount
 *                 value:
 *                   success: false
 *                   message: "Valid total amount is required"
 *               inactive_code:
 *                 summary: Inactive discount code
 *                 value:
 *                   success: false
 *                   message: "Discount code is not active"
 *               expired_code:
 *                 summary: Expired discount code
 *                 value:
 *                   success: false
 *                   message: "Discount code has expired"
 *               minimum_order:
 *                 summary: Minimum order amount not met
 *                 value:
 *                   success: false
 *                   message: "Minimum order amount of $50 required for this discount"
 *               usage_limit:
 *                 summary: Usage limit exceeded
 *                 value:
 *                   success: false
 *                   message: "Discount code usage limit exceeded"
 *               already_used:
 *                 summary: Code already used by user
 *                 value:
 *                   success: false
 *                   message: "You have already used this discount code"
 *       404:
 *         description: Discount code not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid discount code"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Access token is required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error checking discount code"
 */



// Get orders for logged-in user
router.get('/user', verifyToken, async (req, res) => {
  try {
    // Only allow for user role
    if (!req.user || req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
   // console.log('User ID:', req.user.id); // Debugging line
    const userId = req.user.id; 
    const orders = await Order.find({ user: userId })
      .populate('items.product', 'name price images')
      .sort('-createdAt');
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ success: false, message: 'Error fetching user orders' });
  }
});

// Create order — public (guest + logged-in users)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      customerInfo, items, notes, discountCode,
      deliveryFee = 0, subtotal: clientSubtotal, discountAmount: clientDiscount,
      vat: clientVat, totalAmount: clientTotal, paymentMethod = 'cod'
    } = req.body;

    // Validate required fields
    if (!customerInfo || !customerInfo.name || !customerInfo.phone) {
      return res.status(400).json({ success: false, message: 'Customer name and phone are required' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    // Validate products and build items list
    const validatedItems = [];
    let serverSubtotal = 0;

    for (const item of items) {
      if (!item.product || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Each item must have a valid product and quantity' });
      }

      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: `Product not found or inactive` });
      }

      // Stock check — use per-size stock if applicable
      if (item.size && product.hasSizes) {
        const sizeEntry = product.sizes.find(s => s.size === item.size);
        if (!sizeEntry || sizeEntry.stock < item.quantity) {
          return res.status(400).json({ success: false, message: `Insufficient stock for size ${item.size}` });
        }
      } else if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.nameAr || product.name}` });
      }

      const unitPrice = product.priceAfterDiscount > 0 ? product.priceAfterDiscount : product.price;
      serverSubtotal += unitPrice * item.quantity;

      validatedItems.push({
        product: product._id,
        name: product.name,
        nameAr: product.nameAr || product.name,
        image: product.images?.[0] || '',
        size: item.size || '',
        quantity: item.quantity,
        price: unitPrice,
      });
    }

    // Validate discount code if provided
    let discountAmount = 0;
    let appliedDiscountCode = null;
    if (discountCode) {
      const dc = await DiscountCode.findOne({ code: discountCode.toUpperCase(), isActive: true });
      if (dc && (!dc.expiresAt || new Date() < dc.expiresAt)) {
        discountAmount = (serverSubtotal * dc.discount) / 100;
        appliedDiscountCode = dc.code;
        dc.usageCount = (dc.usageCount || 0) + 1;
        await dc.save();
      }
    }

    // Recalculate totals server-side (trust server, not client)
    const VAT_RATE = 0.15;
    const computedDelivery = Number(deliveryFee) || 0;
    const vatBase = serverSubtotal - discountAmount + computedDelivery;
    const vat = vatBase * VAT_RATE;
    const totalAmount = vatBase + vat;

    // Order number: YS-YYYYMMDD-XXXX
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randPart = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `YS-${datePart}-${randPart}`;

    const orderData = {
      orderNumber,
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
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      notes: notes?.trim() || '',
      status: 'pending',
    };

    if (req.user?.role === 'user') orderData.user = req.user.id;

    const order = new Order(orderData);
    await order.save();

    // Decrement stock
    for (const item of validatedItems) {
      if (item.size) {
        await Product.findOneAndUpdate(
          { _id: item.product, 'sizes.size': item.size },
          { $inc: { 'sizes.$.stock': -item.quantity } }
        );
      } else {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      }
    }

    // Fire-and-forget notifications
    Promise.all([
      sendAdminNotification(order),
      order.customerInfo.email ? sendCustomerConfirmation(order) : Promise.resolve(),
    ]).catch(err => console.error('Notification error:', err));

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderNumber: order.orderNumber,
        orderId: order._id,
        totalAmount: order.totalAmount,
        status: order.status,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Error creating order' });
  }
});

// Get all orders (admin only)
router.get('/', verifyToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      startDate,
      endDate,
      sort = '-createdAt'
    } = req.query;

    // Build query
    let query = {};

    // Status filter
    if (status) {
      query.status = status;
    }

    // Search by customer name, email, or order number
    if (search) {
      query.$or = [
        { 'customerInfo.name': { $regex: search, $options: 'i' } },
        { 'customerInfo.email': { $regex: search, $options: 'i' } },
        { orderNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate('items.product', 'name price images')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    // Get order statistics
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total,
        limit: Number(limit)
      },
      stats
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name price images category')
      .populate('items.product.category', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order'
    });
  }
});

// Get order by order number (public - for customer tracking)
router.get('/track/:orderNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .populate('items.product', 'name price images')
      .select('-customerInfo.email -customerInfo.phone -customerInfo.address');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        items: order.items,
        createdAt: order.createdAt,
        customerName: order.customerInfo.name
      }
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking order'
    });
  }
});

// Update order status (admin only)
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // If cancelling order, restore stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } }
        );
      }
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status'
    });
  }
});

// Update order (admin only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { customerInfo, status, notes } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update customer info
    if (customerInfo) {
      if (customerInfo.name) order.customerInfo.name = customerInfo.name.trim();
      if (customerInfo.email) order.customerInfo.email = customerInfo.email.trim().toLowerCase();
      if (customerInfo.phone) order.customerInfo.phone = customerInfo.phone.trim();
      if (customerInfo.address) {
        order.customerInfo.address = {
          street: customerInfo.address.street || '',
          city: customerInfo.address.city || ''
        };
      }
    }

    // Update status
    if (status && status !== order.status) {
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
        });
      }

      // Handle stock changes for cancelled orders
      if (status === 'cancelled' && order.status !== 'cancelled') {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } }
          );
        }
      }

      order.status = status;
    }

    // Update notes
    if (notes !== undefined) {
      order.notes = notes.trim();
    }

    await order.save();
    await order.populate('items.product', 'name price images');

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order'
    });
  }
});

// Delete order (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Restore stock if order is not cancelled
    if (order.status !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } }
        );
      }
    }

    await Order.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting order'
    });
  }
});

// Get order statistics (admin only)
router.get('/admin/stats', verifyToken, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get basic stats
    const totalOrders = await Order.countDocuments();
    const recentOrders = await Order.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Get revenue stats
    const revenueStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    // Get status breakdown
    const statusBreakdown = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get recent revenue
    const recentRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $nin: ['cancelled'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        recentOrders,
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        recentRevenue: recentRevenue[0]?.total || 0,
        averageOrderValue: revenueStats[0]?.averageOrderValue || 0,
        statusBreakdown
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order statistics'
    });
  }
});



// API endpoint to check discount code validity
router.post('/check-discount', verifyToken, async (req, res) => {
  try {
    const { discountCode, totalAmount } = req.body;

    if (!discountCode) {
      return res.status(400).json({
        success: false,
        message: 'Discount code is required'
      });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid total amount is required'
      });
    }

    // Find the discount code
    const discount = await DiscountCode.findOne({ code: discountCode });

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Invalid discount code'
      });
    }

    // Check if discount is active
    if (!discount.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Discount code is not active'
      });
    }

    // Check expiry date
    if (discount.expiryDate && new Date() > discount.expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Discount code has expired'
      });
    }





    // Check if user already used this code (for logged-in users)
    if (req.user && req.user.role === 'user') {
      const user = await require('../models/User').findById(req.user.id);
      if (user && user.usedDiscountCodes.includes(discountCode)) {
        return res.status(400).json({
          success: false,
          message: 'You have already used this discount code'
        });
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    // if (discount.type === 'percentage') {
    discountAmount = (totalAmount * discount.discount) / 100;
    //   if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
    //     discountAmount = discount.maxDiscountAmount;
    //   }
    // } else if (discount.type === 'fixed') {
    //   discountAmount = Math.min(discount.value, totalAmount);
    // }

    const finalAmount = Math.max(0, totalAmount - discountAmount);

    res.status(200).json({
      success: true,
      message: 'Discount code is valid',
      data: {
        discountCode: discount.code,
        discountValue: discount.discount,
        discountAmount: discountAmount.toFixed(2),
        originalAmount: totalAmount.toFixed(2),
        finalAmount: finalAmount.toFixed(2)
      }
    });

  } catch (error) {
    console.error('Check discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking discount code'
    });
  }
});

// ─── Notification Helpers ───────────────────────────────────────────────────

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
  const adminUrl = `${process.env.ADMIN_URL || 'http://localhost:3001'}/admin/orders/${order._id}`;
  const paymentLabels = { cod: '💵 كاش عند الاستلام', mada: '💳 مدى', stcpay: '📱 STC Pay', applepay: '🍎 Apple Pay', card: '💳 بطاقة ائتمان' };
  const itemsRows = order.items.map(i =>
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

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 32px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <div style="width:44px;height:44px;background:rgba(255,255,255,.2);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:white">Y</div>
        <div>
          <div style="color:white;font-size:20px;font-weight:900">يلا سبورت</div>
          <div style="color:rgba(255,255,255,.8);font-size:11px">Yalla Sport</div>
        </div>
      </div>
      <h1 style="color:white;margin:0;font-size:22px;font-weight:800">🛍 طلب جديد!</h1>
      <p style="color:rgba(255,255,255,.9);margin:6px 0 0;font-size:14px">تم استلام طلب جديد ويحتاج إلى معالجة</p>
    </div>

    <!-- Order number banner -->
    <div style="background:#fff7ed;border-bottom:2px solid #fed7aa;padding:16px 32px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:12px;color:#9a3412;font-weight:600;text-transform:uppercase;letter-spacing:.5px">رقم الطلب</div>
        <div style="font-size:22px;font-weight:900;color:#c2410c;letter-spacing:1px">${order.orderNumber}</div>
      </div>
      <div style="text-align:left">
        <div style="font-size:12px;color:#9a3412">التاريخ</div>
        <div style="font-size:14px;font-weight:600;color:#7c2d12">${new Date(order.createdAt).toLocaleString('ar-SA')}</div>
      </div>
    </div>

    <div style="padding:28px 32px">
      <!-- Customer info -->
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #e2e8f0">
        <h3 style="margin:0 0 14px;font-size:15px;color:#0f172a;font-weight:700">👤 بيانات العميل</h3>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px">الاسم</td><td style="padding:4px 0;font-weight:600;font-size:13px">${order.customerInfo.name}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px">الجوال</td><td style="padding:4px 0;font-weight:600;font-size:13px;direction:ltr;text-align:right">${order.customerInfo.phone}</td></tr>
          ${order.customerInfo.email ? `<tr><td style="padding:4px 0;color:#64748b;font-size:13px">الإيميل</td><td style="padding:4px 0;font-weight:600;font-size:13px">${order.customerInfo.email}</td></tr>` : ''}
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px">المنطقة</td><td style="padding:4px 0;font-weight:600;font-size:13px">${order.customerInfo.address?.region || '—'}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px">المدينة</td><td style="padding:4px 0;font-weight:600;font-size:13px">${order.customerInfo.address?.city || '—'}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px">العنوان</td><td style="padding:4px 0;font-weight:600;font-size:13px">${order.customerInfo.address?.street || '—'}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;font-size:13px">الدفع</td><td style="padding:4px 0;font-weight:600;font-size:13px">${paymentLabels[order.paymentMethod] || order.paymentMethod}</td></tr>
        </table>
      </div>

      <!-- Items -->
      <div style="margin-bottom:20px">
        <h3 style="margin:0 0 12px;font-size:15px;color:#0f172a;font-weight:700">📦 المنتجات</h3>
        <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
          <thead>
            <tr style="background:#e2e8f0">
              <th style="padding:10px 8px;font-size:12px;color:#475569;text-align:right">المنتج</th>
              <th style="padding:10px 8px;font-size:12px;color:#475569;text-align:center">المقاس</th>
              <th style="padding:10px 8px;font-size:12px;color:#475569;text-align:center">الكمية</th>
              <th style="padding:10px 8px;font-size:12px;color:#475569;text-align:right">الإجمالي</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>
      </div>

      <!-- Totals -->
      <div style="background:#f8fafc;border-radius:12px;padding:20px;border:1px solid #e2e8f0;margin-bottom:24px">
        <table style="width:100%">
          <tr><td style="padding:5px 0;color:#64748b;font-size:13px">المجموع الفرعي</td><td style="padding:5px 0;font-size:13px;text-align:left">${(order.subtotal||0).toFixed(2)} ر.س</td></tr>
          ${(order.discountAmount||0) > 0 ? `<tr><td style="padding:5px 0;color:#16a34a;font-size:13px">خصم (${order.discountCode})</td><td style="padding:5px 0;color:#16a34a;font-size:13px;text-align:left">-${(order.discountAmount).toFixed(2)} ر.س</td></tr>` : ''}
          <tr><td style="padding:5px 0;color:#64748b;font-size:13px">الشحن</td><td style="padding:5px 0;font-size:13px;text-align:left">${(order.deliveryFee||0) === 0 ? 'مجاني' : `${(order.deliveryFee).toFixed(2)} ر.س`}</td></tr>
          <tr><td style="padding:5px 0;color:#64748b;font-size:13px">ضريبة 15%</td><td style="padding:5px 0;font-size:13px;text-align:left">${(order.vat||0).toFixed(2)} ر.س</td></tr>
          <tr style="border-top:2px solid #e2e8f0">
            <td style="padding:12px 0 5px;font-size:16px;font-weight:800;color:#0f172a">الإجمالي</td>
            <td style="padding:12px 0 5px;font-size:18px;font-weight:900;color:#ea580c;text-align:left">${(order.totalAmount||0).toFixed(2)} ر.س</td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align:center">
        <a href="${adminUrl}" style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);color:white;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:800;font-size:15px">
          عرض الطلب في لوحة الإدارة ←
        </a>
      </div>
    </div>

    <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
      <p style="margin:0;font-size:12px;color:#94a3b8">يلا سبورت — نظام الإدارة | هذا البريد أُرسل تلقائياً</p>
    </div>
  </div>
</body>
</html>`;
}

function buildCustomerEmailHtml(order) {
  const itemsRows = order.items.map(i =>
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

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:32px;text-align:center">
      <div style="width:56px;height:56px;background:rgba(255,255,255,.2);border-radius:16px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:white">Y</div>
      <h1 style="color:white;margin:0 0 6px;font-size:26px;font-weight:900">شكراً لك! 🎉</h1>
      <p style="color:rgba(255,255,255,.9);margin:0;font-size:15px">تم استلام طلبك بنجاح</p>
    </div>

    <!-- Order number -->
    <div style="background:#fff7ed;border-bottom:2px solid #fed7aa;padding:20px 32px;text-align:center">
      <p style="margin:0 0 4px;font-size:13px;color:#9a3412">رقم طلبك</p>
      <div style="font-size:28px;font-weight:900;color:#c2410c;letter-spacing:2px">${order.orderNumber}</div>
      <p style="margin:6px 0 0;font-size:13px;color:#92400e">احتفظ بهذا الرقم لتتبع طلبك</p>
    </div>

    <div style="padding:28px 32px">
      <p style="color:#374151;line-height:1.7;margin-top:0">
        مرحباً <strong>${order.customerInfo.name}</strong>،<br>
        لقد تلقينا طلبك وسيتم التواصل معك قريباً على رقم <strong style="direction:ltr;display:inline-block">${order.customerInfo.phone}</strong> لتأكيد الطلب والتوصيل.
      </p>

      <!-- Items -->
      <h3 style="margin:20px 0 12px;font-size:15px;color:#0f172a;font-weight:700">📦 تفاصيل طلبك</h3>
      <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
        <thead>
          <tr style="background:#e2e8f0">
            <th style="padding:10px 8px;font-size:12px;color:#475569;text-align:right">المنتج</th>
            <th style="padding:10px 8px;font-size:12px;color:#475569;text-align:center">الكمية</th>
            <th style="padding:10px 8px;font-size:12px;color:#475569;text-align:right">الإجمالي</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>

      <!-- Total -->
      <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;margin-top:16px;border:1px solid #e2e8f0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:16px;font-weight:800;color:#0f172a">الإجمالي مع الضريبة</span>
          <span style="font-size:22px;font-weight:900;color:#ea580c">${(order.totalAmount||0).toFixed(2)} ر.س</span>
        </div>
        ${order.paymentMethod === 'cod' ? '<p style="margin:8px 0 0;font-size:13px;color:#6b7280">💵 الدفع عند الاستلام — لا تحتاج لدفع أي شيء الآن</p>' : ''}
      </div>

      <!-- Info box -->
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;margin-top:20px">
        <p style="margin:0;font-size:13px;color:#1d4ed8;line-height:1.7">
          📍 <strong>عنوان التوصيل:</strong> ${order.customerInfo.address?.region || ''} - ${order.customerInfo.address?.city || ''}<br>
          🚀 <strong>موعد التوصيل:</strong> 2-5 أيام عمل<br>
          📞 <strong>للاستفسار:</strong> تواصل معنا عبر واتساب
        </p>
      </div>
    </div>

    <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
      <p style="margin:0;font-size:13px;color:#374151;font-weight:600">يلا سبورت — وجهتك الأولى للرياضة 🏆</p>
      <p style="margin:4px 0 0;font-size:11px;color:#94a3b8">© 2025 Yalla Sport. جميع الحقوق محفوظة.</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendAdminNotification(order) {
  const adminUrl = `${process.env.ADMIN_URL || 'http://localhost:3000'}/admin/orders/${order._id}`;
  const paymentLabels = { cod: 'كاش', mada: 'مدى', stcpay: 'STC Pay', applepay: 'Apple Pay' };

  // Telegram
  const tgText = [
    `🛍 <b>طلب جديد!</b>`,
    `📋 رقم الطلب: <b>${order.orderNumber}</b>`,
    `👤 العميل: ${order.customerInfo?.name}`,
    `📱 الجوال: ${order.customerInfo?.phone}`,
    `📍 ${order.customerInfo?.address?.region} - ${order.customerInfo?.address?.city}`,
    `💳 الدفع: ${paymentLabels[order.paymentMethod] || order.paymentMethod}`,
    `📦 المنتجات: ${order.items.length} قطعة`,
    `💰 الإجمالي: <b>${(order.totalAmount||0).toFixed(2)} ر.س</b>`,
    `🔗 ${adminUrl}`,
  ].join('\n');

  const tgOk = await sendTelegramMessage(tgText);

  // Email to admin
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
// ─── end notification helpers ────────────────────────────────────────────────

module.exports = router;