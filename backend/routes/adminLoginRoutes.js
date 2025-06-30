// routes/adminLoginRoutes.js

const express = require('express');
const router = express.Router();
const adminLoginController = require('../controllers/adminLoginController');

// Use the existing authMiddleware instead of creating a new one
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.post('/login', adminLoginController.adminLogin);

// Protected routes (authentication required)
router.get('/profile', authMiddleware.verifyToken, adminLoginController.getAdminProfile);
router.get('/dashboard', authMiddleware.verifyToken, adminLoginController.getDashboardStats);
router.put('/change-password', authMiddleware.verifyToken, adminLoginController.changePassword);

module.exports = router;
