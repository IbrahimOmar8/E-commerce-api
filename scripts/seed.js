const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Admin = require('../models/Admin');

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Admin.deleteMany({});

    // Create default admin
    console.log('Creating default admin...');
    const admin = new Admin({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'super-admin'
    });
    await admin.save();
    console.log('✓ Default admin created (username: admin, password: admin123)');

    // Create sample categories
    console.log('Creating sample categories...');
    const categories = await Category.create([
      {
        name: 'Electronics',
        description: 'Electronic devices and accessories',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'
      },
      {
        name: 'Clothing',
        description: 'Fashion and apparel',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400'
      },
      {
        name: 'Books',
        description: 'Books and educational materials',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
      },
      {
        name: 'Home & Garden',
        description: 'Home improvement and gardening supplies',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'
      }
    ]);
    console.log('✓ Sample categories created');

    // Create sample products
    console.log('Creating sample products...');
    const products = await Product.create([
      // Electronics
      {
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 199.99,
        category: categories[0]._id,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
        stock: 50,
        featured: true
      },
      {
        name: 'Smartphone',
        description: 'Latest model smartphone with advanced features',
        price: 699.99,
        category: categories[0]._id,
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'],
        stock: 25
      },
      {
        name: 'Laptop',
        description: 'Powerful laptop for work and gaming',
        price: 1299.99,
        category: categories[0]._id,
        images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400'],
        stock: 15,
        featured: true
      },

      // Clothing
      {
        name: 'Classic T-Shirt',
        description: 'Comfortable cotton t-shirt available in multiple colors',
        price: 24.99,
        category: categories[1]._id,
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
        stock: 100
      },
      {
        name: 'Denim Jeans',
        description: 'Premium quality denim jeans with perfect fit',
        price: 79.99,
        category: categories[1]._id,
        images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'],
        stock: 60
      },
      {
        name: 'Winter Jacket',
        description: 'Warm and stylish winter jacket',
        price: 149.99,
        category: categories[1]._id,
        images: ['https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400'],
        stock: 30,
        featured: true
      },

      // Books
      {
        name: 'Programming Guide',
        description: 'Complete guide to modern programming languages',
        price: 39.99,
        category: categories[2]._id,
        images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400'],
        stock: 40
      },
      {
        name: 'Fiction Novel',
        description: 'Bestselling fiction novel',
        price: 19.99,
        category: categories[2]._id,
        images: ['https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400'],
        stock: 80
      },

      // Home & Garden
      {
        name: 'Indoor Plant Pot',
        description: 'Beautiful ceramic pot for indoor plants',
        price: 29.99,
        category: categories[3]._id,
        images: ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400'],
        stock: 45
      },
      {
        name: 'Garden Tools Set',
        description: 'Complete set of essential garden tools',
        price: 89.99,
        category: categories[3]._id,
        images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'],
        stock: 20,
        featured: true
      }
    ]);
    console.log('✓ Sample products created');

    console.log('\n=== SETUP COMPLETE ===');
    console.log('✓ Database seeded successfully!');
    console.log('\nAdmin Login Credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('\nAPI Endpoints:');
    console.log('- Categories: GET /api/categories');
    console.log('- Products: GET /api/products');
    console.log('- Orders: POST /api/orders');
    console.log('- Admin Login: POST /api/auth/login');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();