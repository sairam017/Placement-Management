// models/AdminLogin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminLoginSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'System Administrator'
  },
  uid: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Hash password before saving
adminLoginSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
adminLoginSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('AdminLogin', adminLoginSchema);
