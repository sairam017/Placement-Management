const Application = require("../models/Application");
const Company = require("../models/Company");
const Student = require("../models/studentModel");
const StudentPlacement = require("../models/studentPlacementModel");

// ✅ Apply to company
exports.applyToCompany = async (req, res) => {
  try {
    const { studentUID, companyId } = req.body;

    console.log("=== APPLICATION REQUEST START ===");
    console.log("Apply request received:", { 
      studentUID, 
      studentUIDType: typeof studentUID,
      companyId,
      companyIdType: typeof companyId,
      requestBody: req.body,
      headers: req.headers['content-type']
    });

    if (!studentUID || !companyId) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ 
        success: false, 
        message: "Student UID and Company ID are required" 
      });
    }

    // Ensure studentUID is a string for consistency
    const studentUIDString = String(studentUID);

    console.log("Checking for existing application with studentUID:", studentUIDString, "companyId:", companyId);

    // Check if already applied
    const existingApplication = await Application.findOne({ 
      studentUID: studentUIDString, 
      companyId 
    });

    console.log("Existing application found:", !!existingApplication);

    if (existingApplication) {
      console.log("❌ Already applied");
      return res.status(400).json({ 
        success: false, 
        message: "Already applied to this company" 
      });
    }

    // Get company details
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: "Company not found" 
      });
    }

    console.log("Company found:", company.companyName);

    // Get student details - first try StudentPlacement, then fallback to Student
    let student = await StudentPlacement.findOne({ UID: parseInt(studentUID) });
    let studentSource = 'StudentPlacement';
    
    if (!student) {
      console.log("Student not found in StudentPlacement, checking Student collection...");
      const basicStudent = await Student.findOne({ UID: studentUIDString });
      if (!basicStudent) {
        return res.status(404).json({ 
          success: false, 
          message: "Student not found. Please ensure you are registered." 
        });
      }
      
      // Use basic student info if not in placement collection
      student = {
        name: basicStudent.name,
        department: basicStudent.department,
        section: basicStudent.section,
        UID: basicStudent.UID
      };
      studentSource = 'Student';
      console.log("Using basic student info from Student collection");
    }

    console.log("Student found:", student.name, "from", studentSource, "collection");

    // Create application
    const application = new Application({
      studentUID: studentUIDString,
      studentName: student.name,
      companyId,
      companyName: company.companyName,
      role: company.role,
      ctc: company.ctc,
      department: student.department,
      section: student.section,
      status: 'applied'
    });

    console.log("About to save application:", {
      studentUID: application.studentUID,
      studentName: application.studentName,
      companyId: application.companyId,
      companyName: application.companyName
    });

    try {
      const savedApplication = await application.save();
      
      console.log("✅ Application saved successfully:", {
        id: savedApplication._id,
        studentUID: savedApplication.studentUID,
        companyId: savedApplication.companyId,
        createdAt: savedApplication.createdAt
      });

      res.json({ 
        success: true, 
        message: "Applied successfully!",
        data: savedApplication 
      });
    } catch (saveError) {
      console.error("❌ Error saving application:", saveError);
      
      if (saveError.code === 11000) {
        // Duplicate key error
        return res.status(400).json({ 
          success: false, 
          message: "Already applied to this company" 
        });
      }
      
      throw saveError; // Re-throw to be caught by outer catch
    }

  } catch (error) {
    console.error("Apply error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ✅ Simple test endpoint for debugging
exports.testApplications = async (req, res) => {
  try {
    const totalApplications = await Application.countDocuments();
    const recentApplications = await Application.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('studentUID companyName createdAt');
    
    res.json({
      success: true,
      message: "Application system is working",
      totalApplications,
      recentApplications,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error accessing applications", 
      error: error.message 
    });
  }
};

// ✅ Get applications by student
exports.getApplicationsByStudent = async (req, res) => {
  try {
    const { studentUID } = req.params;
    
    console.log("Fetching applications for studentUID:", studentUID, "Type:", typeof studentUID);
    
    // Ensure studentUID is a string for consistency
    const studentUIDString = String(studentUID);
    
    const applications = await Application.find({ studentUID: studentUIDString })
      .populate('companyId', 'companyName ctc role description department')
      .sort({ appliedAt: -1 });

    console.log("Found applications:", applications.length);
    console.log("Applications data:", applications.map(app => ({
      id: app._id,
      studentUID: app.studentUID,
      companyId: app.companyId?._id || app.companyId,
      companyName: app.companyName,
      status: app.status
    })));

    res.json({ 
      success: true, 
      data: applications,
      count: applications.length 
    });
  } catch (error) {
    console.error("Get student applications error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ✅ Get applications by company
exports.getApplicationsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const applications = await Application.find({ companyId })
      .sort({ appliedAt: -1 });

    // Get additional student details if needed
    const studentUIDs = applications.map(app => parseInt(app.studentUID));
    const students = await StudentPlacement.find({ UID: { $in: studentUIDs } })
      .select('UID name mailid mobile relocate resumeUrl');
    
    const studentsMap = {};
    students.forEach(student => {
      studentsMap[student.UID] = student;
    });

    const applicationsWithDetails = applications.map(app => ({
      _id: app._id,
      studentUID: app.studentUID,
      studentName: app.studentName,
      companyName: app.companyName,
      role: app.role,
      ctc: app.ctc,
      department: app.department,
      section: app.section,
      status: app.status,
      appliedAt: app.appliedAt,
      student: studentsMap[parseInt(app.studentUID)] || null
    }));

    res.json({ 
      success: true, 
      data: applicationsWithDetails,
      count: applicationsWithDetails.length
    });
  } catch (error) {
    console.error("Get company applications error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ✅ Get applications by department
exports.getApplicationsByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    
    const applications = await Application.find({ department })
      .populate('companyId', 'companyName ctc role description')
      .sort({ appliedAt: -1 });

    res.json({ 
      success: true, 
      data: applications,
      count: applications.length 
    });
  } catch (error) {
    console.error("Get department applications error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ✅ Get all applications (for admin/overview)
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('companyId', 'companyName ctc role description department')
      .sort({ appliedAt: -1 });

    // Group by company for better overview
    const groupedByCompany = {};
    applications.forEach(app => {
      const companyName = app.companyName;
      if (!groupedByCompany[companyName]) {
        groupedByCompany[companyName] = {
          company: {
            _id: app.companyId,
            name: companyName,
            role: app.role,
            ctc: app.ctc,
            department: app.department
          },
          applications: [],
          count: 0
        };
      }
      groupedByCompany[companyName].applications.push(app);
      groupedByCompany[companyName].count++;
    });

    res.json({ 
      success: true, 
      data: applications,
      groupedByCompany,
      totalApplications: applications.length,
      totalCompanies: Object.keys(groupedByCompany).length
    });
  } catch (error) {
    console.error("Get all applications error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ✅ Check if student has applied to company
exports.checkApplicationStatus = async (req, res) => {
  try {
    const { studentUID, companyId } = req.params;
    
    // Ensure studentUID is a string for consistency
    const studentUIDString = String(studentUID);
    
    const application = await Application.findOne({ studentUID: studentUIDString, companyId });
    
    res.json({ 
      success: true, 
      hasApplied: !!application,
      application: application || null
    });
  } catch (error) {
    console.error("Check application status error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ✅ Get application statistics
exports.getApplicationStats = async (req, res) => {
  try {
    const totalApplications = await Application.countDocuments();
    
    // Applications by department
    const departmentStats = await Application.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
          students: { $addToSet: "$studentUID" }
        }
      },
      {
        $project: {
          department: "$_id",
          applicationCount: "$count",
          uniqueStudents: { $size: "$students" }
        }
      }
    ]);

    // Applications by company
    const companyStats = await Application.aggregate([
      {
        $group: {
          _id: "$companyId",
          companyName: { $first: "$companyName" },
          count: { $sum: 1 },
          students: { $addToSet: "$studentUID" }
        }
      },
      {
        $project: {
          companyName: 1,
          applicationCount: "$count",
          uniqueStudents: { $size: "$students" }
        }
      },
      { $sort: { applicationCount: -1 } }
    ]);

    res.json({ 
      success: true, 
      data: {
        totalApplications,
        departmentStats,
        companyStats,
        totalCompanies: companyStats.length
      }
    });
  } catch (error) {
    console.error("Get application stats error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};
