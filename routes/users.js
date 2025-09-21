const express = require('express');
const User = require('../models/User');
const verifyToken = require('../Middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile management
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               fullName:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *
 *   delete:
 *     summary: Deactivate user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User object
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update user by ID (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               fullName:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Deactivate user by ID (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deactivated
 *       404:
 *         description: Not found
 */

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// Get current user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ success: false, message: 'Error fetching user profile' });
  }
});

// Update user profile
router.put('/me', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const { username, fullName, password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (username) user.username = username;
    if (fullName) user.fullName = fullName;
    if (password) user.password = password;
    await user.save();
    res.json({ success: true, message: 'Profile updated', data: { username: user.username, fullName: user.fullName } });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
});

// Deactivate user account
router.delete('/me', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await User.findByIdAndUpdate(req.user.id, { isActive: false });
    res.json({ success: true, message: 'Account deactivated' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ success: false, message: 'Error deactivating account' });
  }
});

// List all users (admin only)
router.get('/', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// Get user by ID (admin only)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
});

// Update user by ID (admin only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const { username, fullName, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (username) user.username = username;
    if (fullName) user.fullName = fullName;
    if (isActive !== undefined) user.isActive = isActive;
    await user.save();
    res.json({ success: true, message: 'User updated', data: { username: user.username, fullName: user.fullName, isActive: user.isActive } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user' });
  }
});

// Deactivate user by ID (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'User deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deactivating user' });
  }
});




// Get all user addresses
router.get('/me/addresses', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ 
      success: true, 
      message: 'Addresses retrieved successfully', 
      data: user.useraddress 
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving addresses' });
  }
});

// Create new address
router.post('/me/addresses', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { phone, address } = req.body;
    
    // Basic validation
    if (!address || !address.street || !address.city) {
      return res.status(400).json({ 
        success: false, 
        message: 'Address street and city are required' 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Create new address object
    const newAddress = {
      phone: phone || '',
      address: {
        street: address.street,
        city: address.city
      }
    };

    // Add to user's addresses array
    user.useraddress.push(newAddress);
    await user.save();

    // Get the newly created address (last item in array)
    const createdAddress = user.useraddress[user.useraddress.length - 1];

    res.status(201).json({ 
      success: true, 
      message: 'Address created successfully', 
      data: createdAddress 
    });
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({ success: false, message: 'Error creating address' });
  }
});

// Update specific address
router.put('/me/addresses/:addressId', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { addressId } = req.params;
    const { phone, address } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Find the address by ID
    const addressToUpdate = user.useraddress.id(addressId);
    if (!addressToUpdate) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // Update fields if provided
    if (phone !== undefined) addressToUpdate.phone = phone;
    if (address) {
      if (address.street !== undefined) addressToUpdate.address.street = address.street;
      if (address.city !== undefined) addressToUpdate.address.city = address.city;
    }

    await user.save();

    res.json({ 
      success: true, 
      message: 'Address updated successfully', 
      data: addressToUpdate 
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ success: false, message: 'Error updating address' });
  }
});

// Delete specific address
router.delete('/me/addresses/:addressId', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { addressId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Find and remove the address by ID
    const addressToDelete = user.useraddress.id(addressId);
    if (!addressToDelete) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    user.useraddress.pull(addressId);
    await user.save();

    res.json({ 
      success: true, 
      message: 'Address deleted successfully' 
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ success: false, message: 'Error deleting address' });
  }
});

module.exports = router;
