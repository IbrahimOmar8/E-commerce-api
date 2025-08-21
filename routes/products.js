const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
//const verifyToken = require('../middleware/auth');

const verifyToken = require('../Middleware/auth'); // Ensure you have this middleware for authentication

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: API for managing products
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products with filtering and search
 *     tags: [Products]
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
 *           example: 12
 *       - in: query
 *         name: subcategory
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *       - in: query
 *         name: productType
 *         schema:
 *           type: string
 *           enum: [normal, featured, bestSeller, specialOffer]
 *         description: Filter by product type
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter featured products
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *   post:
 *     summary: Create a new product (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: New Product
 *               description:
 *                 type: string
 *                 example: Product description
 *               price:
 *                 type: number
 *                 example: 99.99
 *               subcategory:
 *                 type: string
 *                 example: 64b7f3c2e4b0f5a1c2d3e4f5
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               stock:
 *                 type: integer
 *                 example: 50
 *               productType:
 *                 type: string
 *                 enum: [normal, featured, bestSeller, specialOffer]
 *                 example: normal
 *               featured:
 *                 type: boolean
 *                 example: false
 *               bestSeller:
 *                 type: boolean
 *                 example: false
 *               specialOffer:
 *                 type: boolean
 *                 example: false
 *               discount:
 *                 type: number
 *                 example: 10
 *               priceAfterDiscount:
 *                 type: number
 *                 example: 89.99
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /products/admin:
 *   get:
 *     summary: Get all products (admin)
 *     tags: [Products]
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
 *         name: subcategory
 *         schema:
 *           type: string
 *         description: Filter by subcategory
 *       - in: query
 *         name: productType
 *         schema:
 *           type: string
 *           enum: [normal, featured, bestSeller, specialOffer]
 *         description: Filter by product type
 *     responses:
 *       200:
 *         description: List of products
 */

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get single product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product object
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update product (admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               subcategory:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               stock:
 *                 type: integer
 *               productType:
 *                 type: string
 *                 enum: [normal, featured, bestSeller, specialOffer]
 *               featured:
 *                 type: boolean
 *               bestSeller:
 *                 type: boolean
 *               specialOffer:
 *                 type: boolean
 *               discount:
 *                 type: number
 *               priceAfterDiscount:
 *                 type: number
 *   delete:
 *     summary: Delete product (admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted
 */

/**
 * @swagger
 * /products/subcategory/{categoryId}:
 *   get:
 *     summary: Get products by subcategory
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of products
 */

/**
 * @swagger
 * /products/{id}/stock:
 *   patch:
 *     summary: Update product stock (admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stock:
 *                 type: integer
 *                 example: 100
 *     responses:
 *       200:
 *         description: Stock updated
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         subcategory:
 *           $ref: '#/components/schemas/Category'
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         stock:
 *           type: integer
 *         productType:
 *           type: string
 *           enum: [normal, featured, bestSeller, specialOffer]
 *         featured:
 *           type: boolean
 *         bestSeller:
 *           type: boolean
 *         specialOffer:
 *           type: boolean
 *         discount:
 *           type: number
 *         priceAfterDiscount:
 *           type: number
 *         isActive:
 *           type: boolean
 */

// List products (public) with filtering, search, pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      subcategory,
      search,
      minPrice,
      maxPrice,
      sort = '-createdAt',
      featured
    } = req.query;

    const query = { isActive: true };

    if (subcategory) query.subcategory = subcategory;
    if (featured !== undefined) query.featured = featured === 'true' || featured === true;
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(query)
      .populate('subcategory', 'name parent')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.json({ success: true, data: products, pagination: { current: Number(page), pages: Math.ceil(total / limit), total, limit: Number(limit) } });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Error fetching products' });
  }
});

// Get all products for admin (includes inactive)
router.get('/admin', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, subcategory, search, sort = '-createdAt' } = req.query;
    const query = {};

    if (subcategory) query.subcategory = subcategory;
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(query)
      .populate('subcategory', 'name parent')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.json({ success: true, data: products, pagination: { current: Number(page), pages: Math.ceil(total / limit), total, limit: Number(limit) } });
  } catch (error) {
    console.error('Get admin products error:', error);
    res.status(500).json({ success: false, message: 'Error fetching products' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('subcategory', 'name parent');

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'Error fetching product' });
  }
});

// Get products by subcategory
router.get('/subcategory/:categoryId', async (req, res) => {
  try {
    const { page = 1, limit = 12, sort = '-createdAt' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find({ subcategory: req.params.categoryId, isActive: true })
      .populate('subcategory', 'name')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments({ subcategory: req.params.categoryId, isActive: true });

    res.json({ success: true, data: products, pagination: { current: Number(page), pages: Math.ceil(total / limit), total, limit: Number(limit) } });
  } catch (error) {
    console.error('Get products by subcategory error:', error);
    res.status(500).json({ success: false, message: 'Error fetching products' });
  }
});

// Create product (admin only)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description, price, subcategory, images, stock, productType, featured, bestSeller, specialOffer, discount, priceAfterDiscount } = req.body;

    if (!name || !description || !price || !subcategory) {
      return res.status(400).json({ success: false, message: 'Missing required fields: name, description, price, subcategory' });
    }

    const subcat = await Category.findById(subcategory);
    if (!subcat) return res.status(400).json({ success: false, message: 'Subcategory not found' });

    const product = new Product({
      name: name.trim(),
      description,
      price,
      subcategory,
      images: images || [],
      stock: stock || 0,
      productType: productType || 'normal',
      featured: !!featured,
      bestSeller: !!bestSeller,
      specialOffer: !!specialOffer,
      discount: discount || 0,
      priceAfterDiscount: priceAfterDiscount || 0
    });
    await product.save();

    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Error creating product' });
  }
});

// Update product (admin only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, description, price, subcategory, images, stock, productType, featured, bestSeller, specialOffer, discount, priceAfterDiscount, isActive } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (subcategory) {
      const subcat = await Category.findById(subcategory);
      if (!subcat) return res.status(400).json({ success: false, message: 'Subcategory not found' });
      product.subcategory = subcategory;
    }

    if (name) product.name = name.trim();
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (images !== undefined) product.images = images;
    if (stock !== undefined) product.stock = stock;
    if (productType !== undefined) product.productType = productType;
    if (featured !== undefined) product.featured = !!featured;
    if (bestSeller !== undefined) product.bestSeller = !!bestSeller;
    if (specialOffer !== undefined) product.specialOffer = !!specialOffer;
    if (discount !== undefined) product.discount = discount;
    if (priceAfterDiscount !== undefined) product.priceAfterDiscount = priceAfterDiscount;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();

    res.json({ success: true, message: 'Product updated successfully', data: product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Error updating product' });
  }
});

// Delete product (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Error deleting product' });
  }
});

// Update product stock (admin only)
router.patch('/:id/stock', verifyToken, async (req, res) => {
  try {
    const { stock } = req.body;
    if (stock === undefined) return res.status(400).json({ success: false, message: 'Stock value is required' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.stock = stock;
    await product.save();

    res.json({ success: true, message: 'Stock updated', data: product });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ success: false, message: 'Error updating stock' });
  }
});

// ensure export
module.exports = router;

