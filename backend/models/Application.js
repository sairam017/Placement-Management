const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  studentUID: {
    type: String,
    required: true,
    ref: 'Student'
  },
  studentName: {
    type: String,
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Company'
  },
  companyName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  ctc: {
    type: Number,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['applied'],
    default: 'applied'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate applications
applicationSchema.index({ studentUID: 1, companyId: 1 }, { unique: true });

// Index for efficient queries
applicationSchema.index({ companyId: 1 });
applicationSchema.index({ department: 1 });
applicationSchema.index({ studentUID: 1 });

module.exports = mongoose.model("Application", applicationSchema);
