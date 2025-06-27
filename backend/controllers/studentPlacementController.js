const StudentPlacement = require('../models/studentPlacementModel');
const path = require('path');

// ✅ Register placement
exports.registerPlacement = async (req, res) => {
  try {
    const {
      name, UID, department, section, mailid, mobile, relocate,
      gender, dob, address, pincode
    } = req.body;

    const uidInt = parseInt(UID, 10);
    if (isNaN(uidInt)) {
      return res.status(400).json({ message: 'UID must be a valid integer' });
    }

    const existing = await StudentPlacement.findOne({ UID: uidInt });
    if (existing) {
      return res.status(400).json({ message: 'UID already registered' });
    }

    let resumeUrl = '';
    if (req.files && req.files['resume'] && req.files['resume'][0]) {
      resumeUrl = `/uploads/resumes/${req.files['resume'][0].filename}`;
    }

    const newRegistration = new StudentPlacement({
      name,
      UID: uidInt,
      department,
      section,
      mailid,
      mobile,
      relocate: relocate === 'true' || relocate === true,
      gender,
      dob,
      address,
      pincode,
      resumeUrl
    });

    await newRegistration.save();
    res.status(201).json({ message: 'Placement registration successful' });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.UID) {
      return res.status(400).json({ message: 'UID already registered' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Apply for company
exports.applyForCompany = async (req, res) => {
  try {
    const { UID, companyId } = req.body;
    console.log('applyForCompany UID:', UID, 'companyId:', companyId); // Debug log
    const student = await StudentPlacement.findOne({ UID });
    console.log('Found student:', student ? student.UID : 'None'); // Debug log
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const existingApp = student.applications.find(app => app.companyId.toString() === companyId);

    if (existingApp) {
      if (existingApp.applied) {
        return res.status(400).json({ message: 'Already applied for this company' });
      } else {
        existingApp.applied = true;
        existingApp.appliedAt = new Date();
      }
    } else {
      student.applications.push({
        companyId,
        applied: true,
        appliedAt: new Date()
      });
    }

    await student.save();
    res.status(200).json({ message: 'Application recorded successfully' });

  } catch (err) {
    res.status(500).json({ message: 'Failed to apply for company', error: err.message });
  }
};

// ✅ Get students by department
exports.getByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const students = await StudentPlacement.find({ department }).select('-__v');
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch students by department', error: err.message });
  }
};

// ✅ Get selected students placeholder
exports.getSelectedStudentDetails = async (req, res) => {
  try {
    res.status(200).json({ message: 'getSelectedStudentDetails not implemented yet' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Get all student placements
exports.getAllStudentPlacements = async (req, res) => {
  try {
    const placements = await StudentPlacement.find();
    res.status(200).json({ data: placements });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Get student by UID
exports.getStudentByUID = async (req, res) => {
  try {
    const { UID } = req.params;
    const student = await StudentPlacement.findOne({ UID });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json(student);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
