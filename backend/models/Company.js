const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  ctc: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  studentUIDs: [
    {
      type: Number,
      required: false
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  batch: {
    type: Number,
    required: false // Unique batch identifier for multiple entries
  }
});

// NO UNIQUE INDEXES - Allow multiple entries for same company with different students
// This ensures permanent storage of all placement opportunities

// Drop the collection and recreate it to remove any conflicting indexes
companySchema.pre('save', function() {
  // This will be called before saving
});

module.exports = mongoose.models.Company || mongoose.model("Company", companySchema);
