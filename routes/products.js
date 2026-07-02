const express = require('express');
const prisma = require('../lib/prisma');
const verifyToken = require('../Middleware/auth');

const router = express.Router();

// Get all products with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1, limit = 20, search, category, brand, gender,
      minPrice, maxPrice, featured, bestSeller, specialOffer,
      productType, isActive = 'true', sort = 'createdAt', order = 'desc',
    } = req.query;

    const where = {};
    if (isActive !== 'all') where.isActive = isActive === 'true';
    if (featured === 'true') where.featured = true;
    if (bestSeller === 'true') where.bestSeller = true;
    if (specialOffer === 'true') where.specialOffer = true;
    if (productType) where.productType = productType;
    if (gender) where.gender = gender;
    if (category) where.subcategoryId = category;
    if (brand) where.brandId = brand;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const orderBy = { [sort]: order };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, skip, take: Number(limit), orderBy,
        include: { subcategory: true, brand: true },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: { current: Number(page), pages: Math.ceil(total / Number(limit)), total, limit: Number(limit) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching products' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { subcategory: true, brand: true, reviews: { include: { user: { select: { username: true, fullName: true } } }, orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching product' });
  }
});

// Create product (admin)
router.post('/', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const {
      name, nameAr, description, descriptionAr, price, discount = 0,
      subcategoryId, brandId, images = [], stock = 0, sizes = [], hasSizes = false,
      sport, sportAr, gender = 'unisex', material, sku, isActive = true,
      productType = 'normal', featured = false, bestSeller = false, specialOffer = false,
    } = req.body;

    if (!name || !description || !price || !subcategoryId)
      return res.status(400).json({ success: false, message: 'name, description, price, subcategoryId are required' });

    const priceAfterDiscount = discount > 0 ? price * (1 - discount / 100) : 0;

    const product = await prisma.product.create({
      data: {
        name, nameAr, description, descriptionAr, price: Number(price),
        discount: Number(discount), priceAfterDiscount,
        subcategoryId, brandId: brandId || null,
        images, stock: Number(stock), sizes, hasSizes,
        sport, sportAr, gender, material, sku: sku || null,
        isActive, productType, featured, bestSeller, specialOffer,
      },
      include: { subcategory: true, brand: true },
    });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(400).json({ success: false, message: 'SKU already exists' });
    res.status(500).json({ success: false, message: 'Error creating product' });
  }
});

// Update product (admin)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const data = { ...req.body };
    if (data.price !== undefined) data.price = Number(data.price);
    if (data.discount !== undefined) {
      data.discount = Number(data.discount);
      data.priceAfterDiscount = data.price && data.discount > 0 ? Number(data.price) * (1 - data.discount / 100) : 0;
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
      include: { subcategory: true, brand: true },
    });
    res.json({ success: true, data: product });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(500).json({ success: false, message: 'Error updating product' });
  }
});

// Delete product (admin)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });

    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(500).json({ success: false, message: 'Error deleting product' });
  }
});

module.exports = router;
