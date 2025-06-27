// models/placementModel.js
const mongoose = require("mongoose");

const placementSchema = new mongoose.Schema({
  studentUID: {
    type: String,
    required: true,
    ref: "Student"
  },
  companyName: {
    type: String,
    required: true
  },
  ctc: {
    type: Number,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  placedDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Placement || mongoose.model("Placement", placementSchema);
