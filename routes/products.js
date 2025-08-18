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
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 12
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           example: 64b7f3c2e4b0f5a1c2d3e4f5
 *         description: Filter by category ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: Laptop
 *         description: Search by product name or description
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           example: 100
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           example: 1000
 *         description: Maximum price filter
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: -createdAt
 *         description: Sort field
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
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 64b7f3c2e4b0f5a1c2d3e4f5
 *                       name:
 *                         type: string
 *                         example: Laptop
 *                       price:
 *                         type: number
 *                         example: 999.99
 *                       category:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: 64b7f3c2e4b0f5a1c2d3e4f5
 *                           name:
 *                             type: string
 *                             example: Electronics
 *       500:
 *         description: Internal server error
 */


// Get all products with filtering and search (public)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      minPrice,
      maxPrice,
      sort = '-createdAt',
      featured
    } = req.query;

    // Build query
    let query = { isActive: true };

    // Category filter
    if (category) {
      query.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Featured filter
    if (featured === 'true') {
      query.featured = true;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total,
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});

// Get all products for admin (includes inactive)
router.get('/admin', verifyToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      sort = '-createdAt'
    } = req.query;

    let query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total,
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Get admin products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name description');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product'
    });
  }
});

// Get products by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { page = 1, limit = 12, sort = '-createdAt' } = req.query;
    const skip = (page - 1) * limit;

    const products = await Product.find({
      category: req.params.categoryId,
      isActive: true
    })
      .populate('category', 'name')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments({
      category: req.params.categoryId,
      isActive: true
    });

    res.json({
      success: true,
      data: products,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total,
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});

// Create product (admin only)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description, price, category, images, stock, featured } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, price, and category are required'
      });
    }

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      category,
      images: images || [],
      stock: stock || 0,
      featured: featured || false
    });

    await product.save();
    await product.populate('category', 'name');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product'
    });
  }
});

// Update product (admin only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      images,
      stock,
      featured,
      isActive
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Verify category if provided
    if (category && category !== product.category.toString()) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }
    }

    // Update fields
    if (name) product.name = name.trim();
    if (description) product.description = description.trim();
    if (price !== undefined) product.price = Number(price);
    if (category) product.category = category;
    if (images !== undefined) product.images = images;
    if (stock !== undefined) product.stock = Number(stock);
    if (featured !== undefined) product.featured = featured;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();
    await product.populate('category', 'name');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product'
    });
  }
});

// Delete product (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product'
    });
  }
});

// Update stock (admin only)
router.patch('/:id/stock', verifyToken, async (req, res) => {
  try {
    const { stock } = req.body;

    if (stock === undefined || stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid stock quantity is required'
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock: Number(stock) },
      { new: true }
    ).populate('category', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating stock'
    });
  }
});

module.exports = router;