// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.get('/dashboard/:role', authMiddleware, (req, res) => {
  res.send(`Welcome to ${req.params.role} Dashboard`);
});

module.exports = router;