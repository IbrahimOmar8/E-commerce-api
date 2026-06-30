const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  nameAr: String,
  image: String,
  size: { type: String, default: null },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customerInfo: {
    name: { type: String, required: [true, 'Customer name is required'] },
    email: { type: String, default: null },
    phone: { type: String, required: [true, 'Customer phone is required'] },
    address: {
      street: String,
      city: String,
      region: String
    }
  },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true, min: 0 },
  discountCode: { type: String, default: null },
  discountAmount: { type: Number, default: 0, min: 0 },
  deliveryFee: { type: Number, default: 0, min: 0 },
  vat: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true, min: [0, 'Total amount cannot be negative'] },
  paymentMethod: {
    type: String,
    enum: ['cod', 'card', 'mada', 'stcpay', 'applepay'],
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  notes: { type: String, trim: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, { timestamps: true });

orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `YS-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
