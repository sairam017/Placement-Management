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

// ✅ Apply for company - now updates status to "applied"
exports.applyForCompany = async (req, res) => {
  try {
    const { UID, companyId } = req.body;
    console.log('applyForCompany UID:', UID, 'companyId:', companyId); // Debug log
    
    const student = await StudentPlacement.findOne({ UID });
    console.log('Found student:', student ? student.UID : 'None'); // Debug log
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find the company to get its details
    const Company = require('../models/Company');
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const existingApp = student.applications.find(app => app.companyId.toString() === companyId);

    if (existingApp) {
      if (existingApp.status !== "not applied") {
        return res.status(400).json({ message: 'Already applied for this company' });
      } else {
        existingApp.status = "applied";
        existingApp.appliedAt = new Date();
        existingApp.updatedAt = new Date();
      }
    } else {
      student.applications.push({
        companyId,
        companyName: company.companyName,
        role: company.role,
        ctc: company.ctc,
        status: "applied",
        appliedAt: new Date(),
        updatedAt: new Date()
      });
    }

    await student.save();
    res.status(200).json({ message: 'Application status updated successfully' });

  } catch (err) {
    res.status(500).json({ message: 'Failed to apply for company', error: err.message });
  }
};

// ✅ Update application status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { UID, companyId, status } = req.body;
    
    // Validate status
    const validStatuses = ["not applied", "applied", "selected", "rejected", "interview", "offer"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const student = await StudentPlacement.findOne({ UID });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find the company to get its details if not exists in application
    const Company = require('../models/Company');
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const existingApp = student.applications.find(app => app.companyId.toString() === companyId);

    if (existingApp) {
      existingApp.status = status;
      existingApp.updatedAt = new Date();
      if (status === "applied" && !existingApp.appliedAt) {
        existingApp.appliedAt = new Date();
      }
    } else {
      student.applications.push({
        companyId,
        companyName: company.companyName,
        role: company.role,
        ctc: company.ctc,
        status: status,
        appliedAt: status === "applied" ? new Date() : null,
        updatedAt: new Date()
      });
    }

    await student.save();
    res.status(200).json({ message: 'Application status updated successfully' });

  } catch (err) {
    res.status(500).json({ message: 'Failed to update application status', error: err.message });
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

// ✅ Update student placement registration
exports.updatePlacementRegistration = async (req, res) => {
  try {
    const { UID } = req.params;
    const {
      name, department, section, mailid, mobile, relocate,
      gender, dob, address, pincode
    } = req.body;

    const uidInt = parseInt(UID, 10);
    if (isNaN(uidInt)) {
      return res.status(400).json({ message: 'UID must be a valid integer' });
    }

    const student = await StudentPlacement.findOne({ UID: uidInt });
    if (!student) {
      return res.status(404).json({ message: 'Student placement registration not found' });
    }

    // Update fields
    if (name) student.name = name;
    if (department) student.department = department;
    if (section) student.section = section;
    if (mailid) student.mailid = mailid;
    if (mobile) student.mobile = mobile;
    if (typeof relocate !== 'undefined') student.relocate = relocate === 'true' || relocate === true;
    if (gender) student.gender = gender;
    if (dob) student.dob = dob;
    if (address) student.address = address;
    if (pincode) student.pincode = pincode;

    // Handle resume update if provided
    if (req.files && req.files['resume'] && req.files['resume'][0]) {
      student.resumeUrl = `/uploads/resumes/${req.files['resume'][0].filename}`;
    }

    await student.save();
    res.status(200).json({ 
      message: 'Placement registration updated successfully',
      student: student 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
