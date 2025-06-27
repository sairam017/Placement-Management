// routes/adminRoutes.js

const express = require('express');
const router = express.Router();

// Import controller
const adminController = require('../controllers/adminController');

// Import middleware (if you have authMiddleware)
const authMiddleware = require('../middleware/authMiddleware');

// Example route – use the correct middleware function
router.get('/dashboard', authMiddleware.verifyToken, adminController.getDashboard);

// Export router
module.exports = router;