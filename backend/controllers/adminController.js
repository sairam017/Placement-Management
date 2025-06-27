// controllers/adminController.js

// GET /api/admin/dashboard
exports.getDashboard = (req, res) => {
  res.status(200).json({
    message: 'Welcome to Admin Dashboard',
    user: req.user // assuming you set req.user in authMiddleware
  });
};