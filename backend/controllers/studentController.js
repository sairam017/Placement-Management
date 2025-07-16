// Get unique departments
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Student.distinct("department");
    res.json(departments.filter(Boolean).map(d => d.trim().toUpperCase()).sort());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change Student Password
exports.changeStudentPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const UID = req.user.UID;
    if (!UID || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const student = await Student.findOne({ UID });
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }
    const isMatch = await bcrypt.compare(oldPassword, student.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ message: "New password must be at least 4 characters long." });
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    student.password = hashedNewPassword;
    await student.save();
    res.json({ message: "Password changed successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};
const Student = require("../models/studentModel");
const PlacementStudent = require("../models/studentPlacementModel");
const bcrypt = require("bcryptjs");

// Create Student
exports.createStudent = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin privileges required." 
      });
    }

    const { name, UID, department, section, password } = req.body;

    if (!name || !UID || !department || !section || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    const existingStudent = await Student.findOne({ UID });
    if (existingStudent) {
      return res.status(400).json({ 
        success: false, 
        message: "UID already taken" 
      });
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

    res.status(201).json({ 
      success: true, 
      message: "Student created successfully", 
      data: studentData 
    });
  } catch (error) {
    console.error('Student creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
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

    const jwt = require("jsonwebtoken");
    const JWT_SECRET = require("../config/jwtSecret");
    const token = jwt.sign({ UID: student.UID, role: "student" }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      message: "Login successful",
      data: studentData,
      token
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get All Students
exports.getAllStudents = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin privileges required." 
      });
    }

    const students = await Student.find().select("-password");
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get Student by UID
exports.getStudentByUID = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin privileges required." 
      });
    }

    const student = await Student.findOne({ UID: req.params.uid }).select("-password");
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: "Student not found",
        data: null 
      });
    }
    res.json({ 
      success: true, 
      data: student 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
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

// Delete Student (Admin only)
exports.deleteStudent = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin privileges required." 
      });
    }

    const student = await Student.findOneAndDelete({ UID: req.params.uid });
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: "Student not found" 
      });
    }
    
    res.json({ 
      success: true,
      message: "Student deleted successfully",
      deletedStudent: {
        UID: student.UID,
        name: student.name,
        department: student.department
      }
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error while deleting student" 
    });
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

// Bulk Create Students
exports.bulkCreateStudents = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin privileges required." 
      });
    }

    const studentsData = req.body;

    if (!Array.isArray(studentsData) || studentsData.length === 0) {
      return res.status(400).json({ message: "Invalid data format. Expected an array of student objects." });
    }

    // Validate each student record
    const validationErrors = [];
    const processedStudents = [];

    for (let i = 0; i < studentsData.length; i++) {
      const student = studentsData[i];
      const { name, UID, department, section, password } = student;

      // Check required fields
      if (!name || !UID || !department || !section) {
        validationErrors.push(`Row ${i + 1}: Missing required fields (name, UID, department, section)`);
        continue;
      }

      // Check for duplicate UIDs in the current batch
      const duplicateInBatch = processedStudents.find(s => s.UID === UID);
      if (duplicateInBatch) {
        validationErrors.push(`Row ${i + 1}: Duplicate UID '${UID}' found in the upload batch`);
        continue;
      }

      // Check if UID already exists in database
      const existingStudent = await Student.findOne({ UID });
      if (existingStudent) {
        validationErrors.push(`Row ${i + 1}: UID '${UID}' already exists in the system`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password || `student_${UID}`, 10);

      processedStudents.push({
        name: name.trim(),
        UID: UID.trim(),
        department: department.trim().toUpperCase(),
        section: section.trim(),
        password: hashedPassword,
      });
    }

    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: "Validation errors found",
        errors: validationErrors,
        processedCount: processedStudents.length,
        totalCount: studentsData.length
      });
    }

    // If no students to process
    if (processedStudents.length === 0) {
      return res.status(400).json({ 
        message: "No valid student records to process" 
      });
    }

    // Bulk insert students
    const insertedStudents = await Student.insertMany(processedStudents);

    res.status(201).json({
      message: `Successfully added ${insertedStudents.length} students`,
      insertedCount: insertedStudents.length,
      totalCount: studentsData.length,
      data: insertedStudents.map(s => ({
        name: s.name,
        UID: s.UID,
        department: s.department,
        section: s.section
      }))
    });

  } catch (error) {
    console.error('Bulk create error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: "Error during bulk upload", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
