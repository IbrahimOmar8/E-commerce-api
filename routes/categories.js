const express = require('express');
const Category = require('../models/Category');  
const verifyToken = require('../Middleware/auth'); // Ensure you have this middleware for authentication
const router = express.Router();

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    // Return only top-level categories and populate direct subcategories
    const categories = await Category.find({ parent: null, isActive: true })
      .sort({ name: 1 })
      .populate({ path: 'subcategories', match: { isActive: true }, select: 'name image isActive parent' });

    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

// Get all categories for admin (includes inactive)
router.get('/admin', verifyToken, async (req, res) => {
  try {
    const categories = await Category.find()
      .sort({ createdAt: -1 })
      .populate('parent', 'name')
      .populate({ path: 'subcategories', select: 'name isActive parent' });

    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Get admin categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name')
      .populate({ path: 'subcategories', match: { isActive: true }, select: 'name image isActive parent' });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category'
    });
  }
});

// Create category (admin only)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description, image, parent } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }

    // If parent provided, validate it exists
    let parentId = null;
    if (parent) {
      const parentCat = await Category.findById(parent).select('_id');
      if (!parentCat) {
        return res.status(400).json({ success: false, message: 'Parent category not found' });
      }
      parentId = parent;
    }

    const category = new Category({
      name: name.trim(),
      description: description?.trim(),
      image: image || '',
      parent: parentId
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category'
    });
  }
});

// Update category (admin only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, description, image, isActive, parent } = req.body;

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Prevent setting parent to itself
    if (parent && parent.toString() === req.params.id) {
      return res.status(400).json({ success: false, message: 'Category cannot be its own parent' });
    }

    // If parent changed, validate it and prevent circular relationships
    if (parent) {
      const parentCat = await Category.findById(parent).select('ancestors _id');
      if (!parentCat) {
        return res.status(400).json({ success: false, message: 'Parent category not found' });
      }
      // If the new parent has this category in its ancestors, it's a circular relation
      if (Array.isArray(parentCat.ancestors) && parentCat.ancestors.find(a => a.toString() === req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid parent - would create a circular hierarchy' });
      }
      category.parent = parent;
    }

    // Check if name already exists (excluding current category)
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category name already exists'
        });
      }
    }

    // Update fields
    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description.trim();
    if (image !== undefined) category.image = image;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category'
    });
  }
});

// Delete category (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has products
    const Product = require('../models/Product');
    const productCount = await Product.countDocuments({ category: req.params.id });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${productCount} product(s) associated with it.`
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category'
    });
  }
});

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: API endpoints to manage categories and subcategories
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get top-level active categories with direct subcategories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Successful response with list of top-level categories
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
 *                     $ref: '#/components/schemas/Category'
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create a new category or subcategory (admin only)
 *     tags: [Categories]
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
 *                 example: Electronics
 *               description:
 *                 type: string
 *                 example: Devices and gadgets
 *               image:
 *                 type: string
 *                 example: https://example.com/image.jpg
 *               parent:
 *                 type: string
 *                 description: Parent category id for subcategory (optional)
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *
 */

/**
 * @swagger
 * /categories/admin:
 *   get:
 *     summary: Get all categories (admin)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all categories including inactive
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
 *                     $ref: '#/components/schemas/Category'
 *       401:
 *         description: Unauthorized
 *
 */

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get single category by id (including subcategories)
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category id
 *     responses:
 *       200:
 *         description: Category object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Not found
 *
 *   put:
 *     summary: Update a category (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               parent:
 *                 type: string
 *                 description: Parent category id to set (or null)
 *     responses:
 *       200:
 *         description: Updated category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 *
 *   delete:
 *     summary: Delete a category (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category id
 *     responses:
 *       200:
 *         description: Successfully deleted
 *       400:
 *         description: Bad request (e.g., has products)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         image:
 *           type: string
 *         isActive:
 *           type: boolean
 *         parent:
 *           type: string
 *           nullable: true
 *         ancestors:
 *           type: array
 *           items:
 *             type: string
 *         subcategories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 */


module.exports = router;