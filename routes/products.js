const express = require('express');
const prisma = require('../lib/prisma');
const verifyToken = require('../Middleware/auth');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function uploadToCloud(buffer) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder: 'yallasport/products' }, (err, result) =>
      err ? reject(err) : resolve(result.secure_url)
    ).end(buffer);
  });
}

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
    let sortField = sort;
    let sortOrder = order;
    if (typeof sort === 'string' && sort.startsWith('-')) {
      sortField = sort.slice(1);
      sortOrder = 'desc';
    } else if (typeof sort === 'string' && sort.startsWith('+')) {
      sortField = sort.slice(1);
      sortOrder = 'asc';
    }
    const orderBy = { [sortField]: sortOrder };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, skip, take: Number(limit), orderBy,
        include: { subcategory: true, brand: true },
      }),
      prisma.product.count({ where }),
    ]);

    const pages = Math.ceil(total / Number(limit));
    res.json({
      success: true,
      data: products,
      total,
      pages,
      pagination: { current: Number(page), pages, total, limit: Number(limit) },
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
router.post('/', verifyToken, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const b = req.body;
    const subcategoryId = b.subcategoryId || b.subcategory;
    const brandId = b.brandId || b.brand || null;
    const toBool = v => v === 'true' || v === true;
    const sizes = b.sizes ? (typeof b.sizes === 'string' ? JSON.parse(b.sizes) : b.sizes) : [];
    const colors = b.colors ? (typeof b.colors === 'string' ? JSON.parse(b.colors) : b.colors) : [];

    if (!b.name || !b.description || !b.price || !subcategoryId)
      return res.status(400).json({ success: false, message: 'name, description, price, subcategoryId are required' });

    // Upload any attached files to Cloudinary (non-fatal — product saves even if upload fails)
    let uploadedUrls = [];
    if (req.files?.length) {
      try {
        uploadedUrls = await Promise.all(req.files.map(f => uploadToCloud(f.buffer)));
      } catch (uploadErr) {
        console.error('Cloudinary upload failed:', uploadErr.message);
      }
    }

    const price = Number(b.price);
    const discount = Number(b.discount || 0);
    const priceAfterDiscount = discount > 0 ? price * (1 - discount / 100) : 0;

    const product = await prisma.product.create({
      data: {
        name: b.name, nameAr: b.nameAr, description: b.description, descriptionAr: b.descriptionAr,
        price, discount, priceAfterDiscount,
        subcategoryId, brandId,
        images: uploadedUrls, stock: Number(b.stock || 0), sizes, hasSizes: toBool(b.hasSizes),
        colors,
        sport: b.sport || null, sportAr: b.sportAr || null, gender: b.gender || 'unisex', material: b.material || null, sku: b.sku || null,
        isActive: b.isActive === 'false' ? false : true,
        productType: b.productType || 'normal',
        featured: toBool(b.featured), bestSeller: toBool(b.bestSeller), specialOffer: toBool(b.specialOffer),
      },
      include: { subcategory: true, brand: true },
    });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    console.error('Create product error:', err);
    if (err.code === 'P2002') return res.status(400).json({ success: false, message: 'SKU already exists' });
    res.status(500).json({ success: false, message: err.message || 'Error creating product' });
  }
});

// Update product (admin)
router.put('/:id', verifyToken, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const data = { ...req.body };
    // aliases
    if (data.subcategory && !data.subcategoryId) { data.subcategoryId = data.subcategory; }
    if (data.brand !== undefined && !data.brandId) { data.brandId = data.brand || null; }
    delete data.subcategory; delete data.brand;
    // fix empty strings → null for optional unique/relation fields
    if (data.brandId === '' || data.brandId === 'undefined') data.brandId = null;
    if (data.sku === '' || data.sku === 'undefined') data.sku = null;
    if (data.sport === '' || data.sport === 'undefined') data.sport = null;
    if (data.sportAr === '' || data.sportAr === 'undefined') data.sportAr = null;
    if (data.material === '') data.material = null;
    // numbers
    if (data.price !== undefined) data.price = Number(data.price);
    if (data.stock !== undefined) data.stock = Number(data.stock);
    if (data.discount !== undefined) {
      data.discount = Number(data.discount);
      const p = data.price ?? 0;
      data.priceAfterDiscount = p > 0 && data.discount > 0 ? p * (1 - data.discount / 100) : 0;
    }
    // booleans (FormData sends strings)
    const toBool = v => v === 'true' || v === true;
    ['isActive', 'featured', 'bestSeller', 'specialOffer', 'hasSizes'].forEach(k => {
      if (data[k] !== undefined) data[k] = k === 'isActive' ? data[k] !== 'false' && data[k] !== false : toBool(data[k]);
    });
    // sizes JSON string
    if (data.sizes !== undefined) {
      if (typeof data.sizes === 'string') {
        try { data.sizes = JSON.parse(data.sizes); } catch { data.sizes = []; }
      }
    }
    // colors JSON string
    if (data.colors !== undefined) {
      if (typeof data.colors === 'string') {
        try { data.colors = JSON.parse(data.colors); } catch { data.colors = []; }
      }
    }

    // Merge kept existing images with any new uploads
    const existing = data.existingImages ? JSON.parse(data.existingImages) : [];
    if (req.files?.length) {
      try {
        const newUrls = await Promise.all(req.files.map(f => uploadToCloud(f.buffer)));
        data.images = [...existing, ...newUrls];
      } catch (uploadErr) {
        console.error('Cloudinary upload failed:', uploadErr.message);
        data.images = existing;
      }
    } else {
      data.images = existing;
    }
    delete data.existingImages;

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
