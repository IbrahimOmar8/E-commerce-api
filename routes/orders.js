const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const DiscountCode = require('../models/DiscountCode');

const verifyToken = require('../Middleware/auth'); // Ensure you have this middleware for authentication

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

// Create order (public - from frontend)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { customerInfo, items, notes, discountCode ,deliveryFee } = req.body;

    // Validate required fields
    if (!customerInfo || !customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, email, and phone are required'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    // Validate and calculate total
    let totalAmount = 0;
    let discountAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.product || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have a valid product and quantity'
        });
      }

      // Get product details
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.product} not found or inactive`
        });
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
        });
      }

      // If user is logged in and discountCode is provided, check if already used
      let user = null;
      if (req.user && req.user.role === 'user') {
        user = await require('../models/User').findById(req.user.id);
        if (discountCode && user && user.usedDiscountCodes.includes(discountCode)) {
          return res.status(400).json({ success: false, message: 'Discount code already used by this user' });
        }
      }

      // After order is saved and discount is applied, mark code as used
      if (user && discountCode) {
        user.usedDiscountCodes.push(discountCode);
        await user.save();


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

        discountAmount = (totalAmount * discount.discount) / 100;



      }



    const itemTotal = product.price * item.quantity;

     // Calculate final total
     totalAmount = Math.max(0, subtotal - discountAmount + deliveryFee);

    
     // totalAmount += itemTotal;

      validatedItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Generate unique order number (e.g., ORD + timestamp + random 3 digits)
    const orderNumber = 'ORD' + Date.now() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    // Create order
    const orderData = {
      orderNumber,
      customerInfo: {
        name: customerInfo.name.trim(),
        email: customerInfo.email.trim().toLowerCase(),
        phone: customerInfo.phone.trim(),
        address: {
          street: customerInfo.address?.street || '',
          city: customerInfo.address?.city || ''
        }
      },
      items: validatedItems,
      subtotal: itemTotal,
      discountCode: discountCode || null,
      discountAmount,
      deliveryFee: deliveryFee || 0,
      totalAmount,
      notes: notes?.trim() || ''
    };
    if (req.user && req.user.role === 'user') {
      orderData.user = req.user.id;
    }
    const order = new Order(orderData);

    await order.save();

    // Update product stock
    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Populate product details for response
    await order.populate('items.product', 'name price images');


    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderNumber: order.orderNumber,
        orderId: order._id,
        totalAmount: order.totalAmount,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order'
    });
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

// Get orders for logged-in user
router.get('/user', verifyToken, async (req, res) => {
  try {
    // Only allow for user role
    if (!req.user || req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const userId = req.user.id;
    const orders = await Order.find({ 'customerInfo.userId': userId })
      .populate('items.product', 'name price images')
      .sort('-createdAt');
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ success: false, message: 'Error fetching user orders' });
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

module.exports = router;