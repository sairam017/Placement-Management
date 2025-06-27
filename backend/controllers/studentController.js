const Student = require("../models/studentModel");
const PlacementStudent = require("../models/studentPlacementModel");
const bcrypt = require("bcryptjs");

// Create Student
exports.createStudent = async (req, res) => {
  try {
    const { name, UID, department, section, password } = req.body;

    if (!name || !UID || !department || !section || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingStudent = await Student.findOne({ UID });
    if (existingStudent) {
      return res.status(400).json({ message: "UID already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await Student.create({
      name,
      UID,
      department,
      section,
      password: hashedPassword,
    });

    const studentData = {
      name: student.name,
      UID: student.UID,
      department: student.department,
      section: student.section
    };

    res.status(201).json({ message: "Student created", data: studentData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login Student
exports.loginStudent = async (req, res) => {
  const { UID, department, password } = req.body;

  try {
    const student = await Student.findOne({ UID, department });
    if (!student) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const studentData = {
      name: student.name,
      UID: student.UID,
      department: student.department,
      section: student.section
    };

    res.json({
      message: "Login successful",
      data: studentData,
      token: "dummy-token" // Replace with JWT if needed
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get All Students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().select("-password");
    res.json({ data: students });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Student by UID
exports.getStudentByUID = async (req, res) => {
  try {
    const student = await Student.findOne({ UID: req.params.uid }).select("-password");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ data: student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Student
exports.updateStudent = async (req, res) => {
  try {
    const { name, department, section } = req.body;
    const student = await Student.findOneAndUpdate(
      { UID: req.params.uid },
      { name, department, section },
      { new: true, runValidators: true }
    ).select("-password");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ message: "Student updated", data: student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ UID: req.params.uid });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Students by Department
exports.getStudentsByDepartment = async (req, res) => {
  try {
    const dept = req.params.dept;
    const students = await Student.find({ department: dept }).select("-password");
    res.json({ data: students });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ New: Apply to company (called from StudentDashboard.js Apply button)
exports.applyToCompany = async (req, res) => {
  try {
    const { name, UID, department, section, companyId } = req.body;
    if (!name || !UID || !department || !section || !companyId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if already applied
    const existing = await PlacementStudent.findOne({ UID, companyId });
    if (existing) {
      return res.status(400).json({ message: "Already applied to this company" });
    }

    const appliedRecord = new PlacementStudent({
      name,
      UID,
      department,
      section,
      companyId,
      applied: true
    });

    await appliedRecord.save();
    res.json({ message: "Applied successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
