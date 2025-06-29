const Application = require("../models/Application");
const Company = require("../models/Company");
const Student = require("../models/studentModel");
const StudentPlacement = require("../models/studentPlacementModel");

// ✅ Apply to company
exports.applyToCompany = async (req, res) => {
  try {
    const { studentUID, companyId } = req.body;

    if (!studentUID || !companyId) {
      return res.status(400).json({ 
        success: false, 
        message: "Student UID and Company ID are required" 
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({ 
      studentUID, 
      companyId 
    });

    if (existingApplication) {
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

    // Get student details from StudentPlacement collection
    const student = await StudentPlacement.findOne({ UID: parseInt(studentUID) });
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: "Student not found. Please register for placement first." 
      });
    }

    // Create application
    const application = new Application({
      studentUID: studentUID,
      studentName: student.name,
      companyId,
      companyName: company.companyName,
      role: company.role,
      ctc: company.ctc,
      department: student.department,
      section: student.section,
      status: 'applied'
    });

    await application.save();

    res.json({ 
      success: true, 
      message: "Applied successfully!",
      data: application 
    });

  } catch (error) {
    console.error("Apply error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ✅ Get applications by student
exports.getApplicationsByStudent = async (req, res) => {
  try {
    const { studentUID } = req.params;
    
    const applications = await Application.find({ studentUID })
      .populate('companyId', 'companyName ctc role description department')
      .sort({ appliedAt: -1 });

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
    
    const application = await Application.findOne({ studentUID, companyId });
    
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
