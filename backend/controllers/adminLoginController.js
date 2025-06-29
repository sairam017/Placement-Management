// controllers/adminLoginController.js

const AdminLogin = require('../models/AdminLogin');
const jwt = require('jsonwebtoken');

// Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { uid, password } = req.body;

    // Validate input
    if (!uid || !password) {
      return res.status(400).json({
        success: false,
        message: 'UID and password are required'
      });
    }

    // Find admin by UID
    const admin = await AdminLogin.findOne({ uid, isActive: true });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Compare password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const jwtSecret = 'mysecretkey'; // Use consistent secret
    const token = jwt.sign(
      { 
        id: admin._id, 
        uid: admin.uid,
        role: admin.role,
        type: 'admin'
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        uid: admin.uid,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// Get Admin Profile
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await AdminLogin.findById(req.user.id).select('-password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Initialize Default Admin (Helper function)
exports.initializeDefaultAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await AdminLogin.findOne({ uid: '1111' });
    
    if (!existingAdmin) {
      // Create default admin
      const defaultAdmin = new AdminLogin({
        name: 'System Administrator',
        uid: '1111',
        password: 'admin123',
        role: 'admin',
        isActive: true
      });

      await defaultAdmin.save();
      console.log('✅ Default admin created successfully');
      console.log('   UID: 1111');
      console.log('   Password: admin123');
    } else {
      console.log('ℹ️  Default admin already exists');
    }
  } catch (error) {
    console.error('❌ Error initializing default admin:', error);
  }
};

// Admin Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Welcome to Admin Dashboard',
      data: {
        totalStudents: 0,
        totalCoordinators: 0,
        totalTPOs: 0,
        totalApplications: 0,
        lastLogin: new Date()
      },
      admin: {
        uid: req.user.uid,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    const admin = await AdminLogin.findById(req.user.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
