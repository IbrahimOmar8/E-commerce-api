const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

categorySchema.add({
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
    index: true
  },
  ancestors: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }
  ]
});

// Virtual to get direct subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Ensure virtuals are included when converting to objects/JSON
categorySchema.set('toObject', { virtuals: true });
categorySchema.set('toJSON', { virtuals: true });

// Pre-save hook to maintain ancestors array based on parent
categorySchema.pre('save', async function(next) {
  try {
    if (this.parent) {
      const Category = mongoose.model('Category');
      const parentCat = await Category.findById(this.parent).select('ancestors _id').lean();
      if (parentCat) {
        this.ancestors = [...(parentCat.ancestors || []), parentCat._id];
      } else {
        this.ancestors = [];
      }
    } else {
      this.ancestors = [];
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Category', categorySchema);