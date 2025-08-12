# E-commerce API

A complete e-commerce REST API built with Node.js, Express, and MongoDB. This API serves both the customer frontend and admin dashboard.

## Features

### Customer Features
- Browse products with pagination, filtering, and search
- View products by category
- Create orders without payment integration
- Track orders by order number

### Admin Features
- Secure admin authentication
- Manage categories (CRUD operations)
- Manage products (CRUD operations)
- View and manage orders
- Order statistics and analytics
- Update order status

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone and setup**
```bash
git clone <your-repo>
cd ecommerce-api
npm install
```

2. **Environment Configuration**
Create a `.env` file in the root directory:
```bash
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=https://elfateh-13.vercel.app
ADMIN_URL=https://elfateh13-admin-dhli.vercel.app
```

3. **Database Setup**
```bash
# Seed the database with sample data
npm run seed
```

4. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5000`

## API Documentation

### Base URL
- Development: `http://localhost:5000/api`
- Production: `your-deployed-url/api`

### Authentication
Admin routes require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Authentication
- `POST /auth/login` - Admin login
- `GET /auth/verify` - Verify token
- `POST /auth/create-admin` - Create first admin (only if no admin exists)

#### Categories
- `GET /categories` - Get all active categories (public)
- `GET /categories/admin` - Get all categories (admin)
- `GET /categories/:id` - Get single category
- `POST /categories` - Create category (admin)
- `PUT /categories/:id` - Update category (admin)
- `DELETE /categories/:id` - Delete category (admin)

#### Products
- `GET /products` - Get products with filtering/search (public)
- `GET /products/admin` - Get all products (admin)
- `GET /products/:id` - Get single product
- `GET /products/category/:categoryId` - Get products by category
- `POST /products` - Create product (admin)
- `PUT /products/:id` - Update product (admin)
- `DELETE /products/:id` - Delete product (admin)
- `PATCH /products/:id/stock` - Update product stock (admin)

#### Orders
- `POST /orders` - Create order (public)
- `GET /orders` - Get all orders (admin)
- `GET /orders/:id` - Get single order (admin)
- `GET /orders/track/:orderNumber` - Track order (public)
- `PATCH /orders/:id/status` - Update order status (admin)
- `PUT /orders/:id` - Update order (admin)
- `DELETE /orders/:id` - Delete order (admin)
- `GET /orders/admin/stats` - Get order statistics (admin)

### Request Examples

#### Create Order
```javascript
POST /api/orders
{
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  },
  "items": [
    {
      "product": "product_id_here",
      "quantity": 2
    }
  ],
  "notes": "Please deliver after 5 PM"
}
```

#### Admin Login
```javascript
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}
```

#### Create Product
```javascript
POST /api/products
Authorization: Bearer <token>
{
  "name": "New Product",
  "description": "Product description",
  "price": 99.99,
  "category": "category_id_here",
  "images": ["image_url_1", "image_url_2"],
  "stock": 50,
  "featured": true
}
```

### Query Parameters

#### Products
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12)
- `category` - Filter by category ID
- `search` - Search in name and description
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `sort` - Sort field (default: -createdAt)
- `featured` - Filter featured products (true/false)

#### Orders (Admin)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `status` - Filter by order status
- `search` - Search by customer name, email, or order number
- `startDate` - Filter orders from date
- `endDate` - Filter orders to date
- `sort` - Sort field (default: -createdAt)

## Default Admin Credentials
After running the seed script:
- **Username:** admin
- **Password:** admin123

⚠️ **Important:** Change these credentials immediately in production!

## Order Status Flow
1. `pending` - Order created, awaiting confirmation
2. `confirmed` - Order confirmed by admin
3. `processing` - Order is being prepared
4. `shipped` - Order has been shipped
5. `delivered` - Order delivered to customer
6. `cancelled` - Order cancelled (stock restored)

## Error Handling
All endpoints return consistent error responses:
```javascript
{
  "success": false,
  "message": "Error description"
}
```

## Success Responses
All successful responses include:
```javascript
{
  "success": true,
  "data": {...}, // Response data
  "message": "Success message" // Optional
}
```

## Deployment

### Environment Variables for Production
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce
JWT_SECRET=your-super-secure-jwt-secret
FRONTEND_URL=https://elfateh-13.vercel.app
ADMIN_URL=https://elfateh13-admin-dhli.vercel.app
```

### Deployment Platforms
- **Heroku:** Ready to deploy
- **Vercel:** Add `vercel.json` configuration
- **Railway:** Direct deployment support
- **DigitalOcean:** App Platform ready

## Security Features
- JWT authentication for admin routes
- Password hashing with bcrypt
- CORS configuration
- Input validation and sanitization
- Error handling middleware

## Development

### Project Structure
```
├── models/           # Database models
├── routes/           # API routes
├── scripts/          # Utility scripts
├── server.js         # Main server file
├── package.json      # Dependencies
└── README.md         # Documentation
```

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with sample data

## Support
For issues and questions, please check the API documentation or create an issue in the repository.

## License
MIT License