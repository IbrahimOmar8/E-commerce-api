const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');



// Import routes
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const discountCodeRoutes = require('./routes/discountCodes');
const usersRoutes = require('./routes/users');
const brandRoutes = require('./routes/brands');
const reviewRoutes = require('./routes/reviews');
const statsRoutes = require('./routes/stats');
const wishlistRoutes = require('./routes/wishlist');
const sportsRoutes = require('./routes/sports');

dotenv.config();

const app = express();

// Middleware
// app.use(cors({
//   origin: [
//     'https://elfateh-13.vercel.app',
//     'https://elfateh13-admin-dhli.vercel.app',
//     'http://localhost:3000',
//     'http://localhost:3001',
//   ]
// }));
app.use(cors({
 origin: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Prisma returns `id`; frontend expects `_id`. Add _id alias recursively to all JSON responses.
function addIdAlias(value) {
  if (Array.isArray(value)) return value.map(addIdAlias);
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const result = {};
    for (const [k, v] of Object.entries(value)) result[k] = addIdAlias(v);
    if ('id' in result && !('_id' in result)) result._id = result.id;
    return result;
  }
  return value;
}
app.use((req, res, next) => {
  const orig = res.json.bind(res);
  res.json = function (data) { return orig(addIdAlias(data)); };
  next();
});

// Database connection is managed by Prisma (see lib/prisma.js)


// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce API',
      version: '1.0.0',
      description: 'API documentation for the E-Commerce platform',
      contact: {
        name: 'API Support',
        email: 'support@myapi.com'
      }
    },
    servers: [
      {
        url: (process.env.base_URL ||'http://localhost:5000/api'),
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./routes/*.js'] // only route files
};

let specs;
try {
  specs = swaggerJsdoc(swaggerOptions);
} catch (err) {
  console.error('Swagger JSDoc generation error:', err);
  specs = {
    openapi: '3.0.0',
    info: { title: 'E-Commerce API (docs generation failed)', version: '1.0.0', description: 'Swagger docs could not be generated. Check server logs.' },
    paths: {},
    components: {}
  };
}

// Swagger UI setup - safe
app.use('/api-docs', swaggerUi.serve, (req, res, next) => {
  // If specs.paths is empty, show a simple message instead of failing
  if (!specs || Object.keys(specs.paths || {}).length === 0) {
    res.setHeader('Content-Type', 'text/html');
    return res.send('<h1>API documentation is unavailable</h1><p>Check server logs for Swagger generation errors.</p>');
  }
  next();
}, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'E-Commerce API Documentation'
}));


// Routes

// Helper to resolve a router export whether it's a function, .router, or .default
function resolveRouter(mod) {
  if (!mod) return null;
  if (typeof mod === 'function') return mod;
  if (mod.router && typeof mod.router === 'function') return mod.router;
  if (mod.default && typeof mod.default === 'function') return mod.default;
  return null;
}

const authRouter = resolveRouter(authRoutes);
const categoryRouter = resolveRouter(categoryRoutes);
const productRouter = resolveRouter(productRoutes);
const orderRouter = resolveRouter(orderRoutes);
const discountCodeRouter = resolveRouter(discountCodeRoutes);
const usersRouter = resolveRouter(usersRoutes);
const brandRouter = resolveRouter(brandRoutes);
const reviewRouter = resolveRouter(reviewRoutes);
const statsRouter = resolveRouter(statsRoutes);
const wishlistRouter = resolveRouter(wishlistRoutes);

if (authRouter) app.use('/api/auth', authRouter); else console.error('Invalid router exported from ./routes/auth');
if (categoryRouter) app.use('/api/categories', categoryRouter); else console.error('Invalid router exported from ./routes/categories');
if (productRouter) app.use('/api/products', productRouter); else console.error('Invalid router exported from ./routes/products');
if (orderRouter) app.use('/api/orders', orderRouter); else console.error('Invalid router exported from ./routes/orders');
if (discountCodeRouter) app.use('/api/discount-codes', discountCodeRouter); else console.error('Invalid router exported from ./routes/discountCodes');
if (usersRouter) app.use('/api/users', usersRouter); else console.error('Invalid router exported from ./routes/users');
if (brandRouter) app.use('/api/brands', brandRouter); else console.error('Invalid router exported from ./routes/brands');
if (reviewRouter) app.use('/api/reviews', reviewRouter); else console.error('Invalid router exported from ./routes/reviews');
if (statsRouter) app.use('/api/stats', statsRouter); else console.error('Invalid router exported from ./routes/stats');
if (wishlistRouter) app.use('/api/wishlist', wishlistRouter); else console.error('Invalid router exported from ./routes/wishlist');
const sportsRouter = resolveRouter(sportsRoutes);
if (sportsRouter) app.use('/api/sports', sportsRouter); else console.error('Invalid router exported from ./routes/sports');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'E-commerce API is running' });
});

// Seed sports (protected by SEED_SECRET env var)
app.post('/api/seed/sports', async (req, res) => {
  const secret = process.env.SEED_SECRET;
  if (!secret || req.headers['x-seed-secret'] !== secret) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  try {
    const prisma = require('./lib/prisma');
    const DEFAULT_SPORTS = [
      { name: 'boxing',     nameAr: 'ملاكمة',          icon: '🥊', sortOrder: 1 },
      { name: 'kickboxing', nameAr: 'كيك بوكسينج',     icon: '🦵', sortOrder: 2 },
      { name: 'karate',     nameAr: 'كاراتيه',         icon: '🥋', sortOrder: 3 },
      { name: 'taekwondo',  nameAr: 'تايكوندو',        icon: '🦶', sortOrder: 4 },
      { name: 'muaythai',   nameAr: 'مواي تاي',        icon: '🥊', sortOrder: 5 },
      { name: 'swimming',   nameAr: 'سباحة',           icon: '🏊', sortOrder: 6 },
      { name: 'fitness',    nameAr: 'اللياقة البدنية', icon: '🏋️', sortOrder: 7 },
      { name: 'football',   nameAr: 'كرة القدم',       icon: '⚽', sortOrder: 8 },
      { name: 'basketball', nameAr: 'كرة السلة',       icon: '🏀', sortOrder: 9 },
      { name: 'cycling',    nameAr: 'دراجات',          icon: '🚴', sortOrder: 10 },
    ];
    const results = [];
    for (const sport of DEFAULT_SPORTS) {
      const existing = await prisma.sport.findUnique({ where: { name: sport.name } });
      if (existing) {
        results.push({ sport: sport.nameAr, status: 'skipped' });
      } else {
        await prisma.sport.create({ data: { ...sport, isActive: true } });
        results.push({ sport: sport.nameAr, status: 'created' });
      }
    }
    res.json({ success: true, results });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Cloudinary connection test (admin-only diagnostic)
const cloudinaryTest = require('cloudinary').v2;
cloudinaryTest.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
app.get('/api/health/cloudinary', async (req, res) => {
  try {
    const result = await cloudinaryTest.api.ping();
    res.json({ ok: true, cloud_name: process.env.CLOUDINARY_CLOUD_NAME, result });
  } catch (err) {
    res.status(500).json({ ok: false, cloud_name: process.env.CLOUDINARY_CLOUD_NAME, error: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});