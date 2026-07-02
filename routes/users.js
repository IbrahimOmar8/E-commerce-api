const express = require('express');
const prisma = require('../lib/prisma');
const verifyToken = require('../Middleware/auth');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const router = express.Router();

// Get current user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'user')
      return res.status(403).json({ success: false, message: 'Access denied' });
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, fullName: true, email: true, phone: true, isActive: true, wishlist: true, useraddress: true, createdAt: true, updatedAt: true },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching user profile' });
  }
});

// Update user profile
router.put('/me', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'user')
      return res.status(403).json({ success: false, message: 'Access denied' });
    const { username, fullName, password } = req.body;
    const data = {};
    if (username) data.username = username;
    if (fullName) data.fullName = fullName;
    if (password) data.password = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({ where: { id: req.user.id }, data, select: { username: true, fullName: true } });
    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'User not found' });
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
});

// Deactivate user account
router.delete('/me', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'user')
      return res.status(403).json({ success: false, message: 'Access denied' });
    await prisma.user.update({ where: { id: req.user.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Account deactivated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error deactivating account' });
  }
});

// Get all user addresses
router.get('/me/addresses', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'user')
      return res.status(403).json({ success: false, message: 'Access denied' });
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { useraddress: true } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Addresses retrieved successfully', data: user.useraddress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error retrieving addresses' });
  }
});

// Create new address
router.post('/me/addresses', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'user')
      return res.status(403).json({ success: false, message: 'Access denied' });
    const { phone, address } = req.body;
    if (!address || !address.street || !address.city)
      return res.status(400).json({ success: false, message: 'Address street and city are required' });
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { useraddress: true } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const newAddress = { id: randomUUID(), phone: phone || '', address: { street: address.street, city: address.city } };
    const addresses = Array.isArray(user.useraddress) ? [...user.useraddress, newAddress] : [newAddress];
    await prisma.user.update({ where: { id: req.user.id }, data: { useraddress: addresses } });
    res.status(201).json({ success: true, message: 'Address created successfully', data: newAddress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error creating address' });
  }
});

// Update specific address
router.put('/me/addresses/:addressId', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'user')
      return res.status(403).json({ success: false, message: 'Access denied' });
    const { addressId } = req.params;
    const { phone, address } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { useraddress: true } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const addresses = Array.isArray(user.useraddress) ? user.useraddress : [];
    const idx = addresses.findIndex(a => a.id === addressId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Address not found' });
    if (phone !== undefined) addresses[idx].phone = phone;
    if (address) {
      if (address.street !== undefined) addresses[idx].address.street = address.street;
      if (address.city !== undefined) addresses[idx].address.city = address.city;
    }
    await prisma.user.update({ where: { id: req.user.id }, data: { useraddress: addresses } });
    res.json({ success: true, message: 'Address updated successfully', data: addresses[idx] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error updating address' });
  }
});

// Delete specific address
router.delete('/me/addresses/:addressId', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'user')
      return res.status(403).json({ success: false, message: 'Access denied' });
    const { addressId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { useraddress: true } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const addresses = Array.isArray(user.useraddress) ? user.useraddress : [];
    const filtered = addresses.filter(a => a.id !== addressId);
    if (filtered.length === addresses.length) return res.status(404).json({ success: false, message: 'Address not found' });
    await prisma.user.update({ where: { id: req.user.id }, data: { useraddress: filtered } });
    res.json({ success: true, message: 'Address deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error deleting address' });
  }
});

// List all users (admin only)
router.get('/', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });
    const users = await prisma.user.findMany({
      select: { id: true, username: true, fullName: true, email: true, phone: true, isActive: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// Get user by ID (admin only)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, username: true, fullName: true, email: true, phone: true, isActive: true, createdAt: true, updatedAt: true },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
});

// Update user by ID (admin only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });
    const { username, fullName, isActive } = req.body;
    const data = {};
    if (username !== undefined) data.username = username;
    if (fullName !== undefined) data.fullName = fullName;
    if (isActive !== undefined) data.isActive = isActive;
    const user = await prisma.user.update({ where: { id: req.params.id }, data, select: { username: true, fullName: true, isActive: true } });
    res.json({ success: true, message: 'User updated', data: user });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'User not found' });
    res.status(500).json({ success: false, message: 'Error updating user' });
  }
});

// Deactivate user by ID (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin'))
      return res.status(403).json({ success: false, message: 'Access denied' });
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'User not found' });
    res.status(500).json({ success: false, message: 'Error deactivating user' });
  }
});

module.exports = router;
