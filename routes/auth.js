const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username and password are required' });

    const admin = await prisma.admin.findFirst({
      where: { OR: [{ username }, { email: username }], isActive: true },
    });
    if (!admin) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, JWT_SECRET, { expiresIn: '100h' });
    res.json({ success: true, message: 'Login successful', token, admin: { id: admin.id, username: admin.username, email: admin.email, role: admin.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Create first admin (initial setup)
router.post('/create-admin', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const count = await prisma.admin.count();
    if (count > 0) return res.status(400).json({ success: false, message: 'Admin already exists' });

    const hashed = await bcrypt.hash(password || 'admin123', 10);
    const admin = await prisma.admin.create({
      data: { username: username || 'admin', email: email || 'admin@example.com', password: hashed, role: 'super-admin' },
    });
    res.status(201).json({ success: true, message: 'Admin created successfully', admin: { id: admin.id, username: admin.username, email: admin.email, role: admin.role } });
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ success: false, message: 'Error creating admin' });
  }
});

// User signup
router.post('/signup', async (req, res) => {
  try {
    const { username, fullName, password, phone } = req.body;
    if (!username || !fullName || !password)
      return res.status(400).json({ success: false, message: 'username, fullName, and password are required' });

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ success: false, message: 'Username already exists' });

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        username,
        fullName,
        password: hashed,
        email: username,
        phone: phone ? phone.replace(/\s/g, '') : null,
      },
    });
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Error during signup' });
  }
});

// User login
router.post('/user-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username and password are required' });

    const user = await prisma.user.findFirst({ where: { username, isActive: true } });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, role: 'user' }, JWT_SECRET, { expiresIn: '100h' });
    res.json({ success: true, message: 'Login successful', token, user: { id: user.id, username: user.username, fullName: user.fullName, role: 'user' } });
  } catch (err) {
    console.error('User login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Verify token
router.get('/verify', (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, admin: decoded });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// List admins (super-admin only)
router.get('/admins', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'super-admin') return res.status(403).json({ success: false, message: 'Access denied' });
    const admins = await prisma.admin.findMany({ select: { id: true, username: true, email: true, role: true, isActive: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: admins });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Create admin (super-admin only)
router.post('/admins', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'super-admin') return res.status(403).json({ success: false, message: 'Access denied' });
    const { username, email, password, role = 'admin' } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'username and password required' });
    const hashed = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({ data: { username, email: email || '', password: hashed, role } });
    res.status(201).json({ success: true, data: { id: admin.id, username: admin.username, email: admin.email, role: admin.role } });
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ success: false, message: 'Username already exists' });
    res.status(500).json({ success: false, message: 'Error creating admin' });
  }
});

// Deactivate/delete admin (super-admin only)
router.delete('/admins/:id', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'super-admin') return res.status(403).json({ success: false, message: 'Access denied' });
    if (decoded.id === req.params.id) return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    await prisma.admin.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Admin deactivated' });
  } catch {
    res.status(500).json({ success: false, message: 'Error deactivating admin' });
  }
});

module.exports = router;
