const mongoose = require('mongoose');

const studentPlacementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  UID: { type: Number, required: true, unique: true }, // Change UID to integer and unique
  gender: { type: String },
  dob: { type: String },
  address: { type: String },
  pincode: { type: String },
  department: { type: String, required: true },
  section: { type: String, required: true },
  mailid: { type: String, required: true },
  mobile: { type: String, required: true },
  relocate: { type: Boolean, required: true },
  resumeUrl: { type: String, required: true },
  applications: [
    {
      companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
      applied: { type: Boolean, default: false },
      appliedAt: { type: Date }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudentPlacement', studentPlacementSchema);
