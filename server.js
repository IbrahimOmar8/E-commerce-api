const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');



// Import routes
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://elfateh-13.vercel.app',
    'https://elfateh13-admin-dhli.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//console.log('Trying to connect to:', process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');


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
        url: 'http://localhost:5000/api',
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

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

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

if (authRouter) app.use('/api/auth', authRouter); else console.error('Invalid router exported from ./routes/auth');
if (categoryRouter) app.use('/api/categories', categoryRouter); else console.error('Invalid router exported from ./routes/categories');
if (productRouter) app.use('/api/products', productRouter); else console.error('Invalid router exported from ./routes/products');
if (orderRouter) app.use('/api/orders', orderRouter); else console.error('Invalid router exported from ./routes/orders');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'E-commerce API is running' });
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