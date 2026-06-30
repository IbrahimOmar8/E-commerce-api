const mongoose = require('mongoose');

const sizeStockSchema = new mongoose.Schema({
  size: { type: String, required: true },
  stock: { type: Number, default: 0, min: 0 }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  nameAr: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  descriptionAr: {
    type: String
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  priceAfterDiscount: {
    type: Number,
    default: 0
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product subcategory is required']
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    default: null
  },
  images: [{ type: String }],
  // If no sizes needed, use flat stock
  stock: {
    type: Number,
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  // Sizes with individual stock (for clothing/shoes)
  sizes: [sizeStockSchema],
  hasSizes: {
    type: Boolean,
    default: false
  },
  sport: {
    type: String,
    trim: true
  },
  sportAr: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['men', 'women', 'kids', 'unisex'],
    default: 'unisex'
  },
  material: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    trim: true,
    sparse: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  productType: {
    type: String,
    enum: ['normal', 'featured', 'bestSeller', 'specialOffer'],
    default: 'normal'
  },
  featured: { type: Boolean, default: false },
  bestSeller: { type: Boolean, default: false },
  specialOffer: { type: Boolean, default: false },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

productSchema.index({ name: 'text', nameAr: 'text', description: 'text' });
productSchema.index({ subcategory: 1, isActive: 1 });
productSchema.index({ brand: 1, isActive: 1 });
productSchema.index({ sport: 1 });
productSchema.index({ gender: 1 });
productSchema.index({ price: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ bestSeller: 1 });

module.exports = mongoose.model('Product', productSchema);
