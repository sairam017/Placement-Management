const Company = require("../models/Company");
const StudentPlacement = require("../models/studentPlacementModel");

// Debug only – safe, does not delete anything
const logCurrentIndexes = async () => {
  try {
    const indexes = await Company.collection.getIndexes();
    console.log("Current indexes on Company collection:", Object.keys(indexes));
  } catch (error) {
    console.error("Error checking indexes:", error);
  }
};

// ✅ Add new company (no overwriting, no deletion)
exports.addCompany = async (req, res) => {
  const { companyName, role, ctc, description, department, studentUIDs } = req.body;

  if (!companyName || !role || !ctc || !description || !department) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    await logCurrentIndexes();

    const newCompany = new Company({
      companyName: companyName.trim(),
      role: role.trim(),
      ctc: parseFloat(ctc),
      description: description.trim(),
      department: department.trim(),
      studentUIDs: Array.isArray(studentUIDs) ? studentUIDs : [],
      createdAt: new Date()
    });

    const savedCompany = await newCompany.save();

    return res.status(201).json({
      message: "Company placement opportunity added successfully!",
      company: savedCompany,
      action: "created",
      permanent: true
    });
  } catch (error) {
    console.error("Error adding company:", error);

    return res.status(500).json({
      message: "Failed to add company: " + error.message,
      permanent: true
    });
  }
};

// ✅ Get companies by department
exports.getCompaniesByDepartment = async (req, res) => {
  try {
    const dept = req.query.department;
    
    // Find companies for the specific department OR for "ALL" departments (added by TPO)
    const companies = await Company.find({ 
      $or: [
        { department: dept },
        { department: "ALL" }
      ]
    });
    
    res.json({ data: companies });
  } catch (error) {
    console.error("Error fetching companies by department:", error);
    res.status(500).json({ message: "Failed to fetch companies." });
  }
};

// ✅ Get companies accessible to a specific student UID
exports.getCompaniesByStudentUID = async (req, res) => {
  try {
    const { studentUID } = req.params;
    const studentUIDNumber = parseInt(studentUID);
    
    console.log("Fetching companies for student UID:", studentUIDNumber);
    
    if (!studentUIDNumber) {
      return res.status(400).json({ 
        success: false, 
        message: "Valid student UID is required" 
      });
    }

    // First, get the student's department from StudentPlacement collection
    const StudentPlacement = require("../models/studentPlacementModel");
    let studentDepartment = null;
    
    try {
      const studentData = await StudentPlacement.findOne({ UID: studentUIDNumber });
      if (studentData) {
        studentDepartment = studentData.department;
        console.log("Student department from placement data:", studentDepartment);
      }
    } catch (err) {
      console.log("Could not find student in placement collection, continuing with basic search");
    }

    // STRICT UID-BASED FILTERING: Show companies ONLY if:
    // 1. Student UID is SPECIFICALLY listed in studentUIDs array
    // 2. OR department is "ALL" (TPO companies for all students)
    // 3. OR company department matches student department AND studentUIDs is empty (for backward compatibility)
    let searchCriteria = [
      { studentUIDs: studentUIDNumber },  // Exact UID match only
      { department: "ALL" }               // TPO companies for all students
    ];

    // Add department-based matching only if student department is found and for companies with empty studentUIDs
    if (studentDepartment) {
      searchCriteria.push({
        department: studentDepartment,
        studentUIDs: { $size: 0 }  // Only if no specific students assigned
      });
    }

    console.log("Search criteria:", JSON.stringify(searchCriteria, null, 2));

    const companies = await Company.find({
      $or: searchCriteria
    }).sort({ createdAt: -1 });
    
    console.log(`\n=== FILTERING RESULTS FOR STUDENT UID ${studentUIDNumber} ===`);
    console.log(`Student Department: ${studentDepartment || 'NOT FOUND'}`);
    console.log(`Total Companies Found: ${companies.length}`);
    
    companies.forEach((company, index) => {
      let reason = '';
      if (company.studentUIDs.includes(studentUIDNumber)) {
        reason = `🎯 SPECIFICALLY ASSIGNED - UID ${studentUIDNumber} is in studentUIDs array`;
      } else if (company.department === 'ALL') {
        reason = `🌐 TPO COMPANY - Available to all students`;
      } else if (company.department === studentDepartment && company.studentUIDs.length === 0) {
        reason = `🏫 DEPARTMENT COMPANY - ${studentDepartment} department, no specific students assigned`;
      } else {
        reason = `❓ UNEXPECTED - This should not appear!`;
      }
      
      console.log(`${index + 1}. ${company.companyName}`);
      console.log(`   Department: ${company.department}`);
      console.log(`   Student UIDs: [${company.studentUIDs.join(', ') || 'NONE'}]`);
      console.log(`   Access Reason: ${reason}`);
      console.log('');
    });
    
    console.log(`=== END FILTERING RESULTS ===\n`);
    
    res.json({ 
      success: true,
      data: companies,
      count: companies.length,
      studentUID: studentUIDNumber,
      studentDepartment: studentDepartment
    });
  } catch (error) {
    console.error("Error fetching companies for student UID:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch companies." 
    });
  }
};

// ✅ Get all companies
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    res.json({ data: companies });
  } catch (error) {
    console.error("Error fetching all companies:", error);
    res.status(500).json({ message: "Failed to fetch companies." });
  }
};

// ✅ Get applicants by company (filtering on applications array)
exports.getApplicantsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    if (!companyId) {
      return res.status(400).json({ message: "companyId is required" });
    }

    const applicants = await StudentPlacement.find(
      {
        "applications.companyId": companyId,
        "applications.status": { $ne: "not applied" }
      },
      "name UID section department mailid mobile relocate resumeUrl applications"
    );

    res.status(200).json(applicants);
  } catch (error) {
    console.error("Error fetching applicants by company:", error);
    res.status(500).json({ message: "Failed to fetch applicants." });
  }
};

// ✅ Add students to an existing company (no overwrite, creates new round)
exports.addStudentsToCompany = async (req, res) => {
  const { companyId, studentUIDs } = req.body;

  if (!companyId || !Array.isArray(studentUIDs) || studentUIDs.length === 0) {
    return res.status(400).json({
      message: "Company ID and student UIDs array are required"
    });
  }

  try {
    const originalCompany = await Company.findById(companyId);
    if (!originalCompany) {
      return res.status(404).json({ message: "Company not found" });
    }

    const newCompanyEntry = new Company({
      companyName: originalCompany.companyName,
      role: originalCompany.role,
      ctc: originalCompany.ctc,
      description: originalCompany.description,
      department: originalCompany.department,
      studentUIDs,
      createdAt: new Date(),
      batch: new Date().getTime()
    });

    const savedCompany = await newCompanyEntry.save();

    return res.status(201).json({
      message: "New placement round created successfully!",
      company: savedCompany,
      originalCompanyId: companyId,
      action: "new_round_created",
      permanent: true
    });
  } catch (error) {
    console.error("Error adding new placement round:", error);
    return res.status(500).json({
      message: "Failed to create new placement round: " + error.message
    });
  }
};

// ✅ Database info (no mutations)
exports.getDatabaseStats = async (req, res) => {
  try {
    console.log("Getting database statistics...");

    const indexes = await Company.collection.getIndexes();
    const companyCount = await Company.countDocuments();

    const departmentStats = await Company.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
          companies: {
            $push: {
              name: "$companyName",
              role: "$role",
              studentsCount: { $size: "$studentUIDs" }
            }
          }
        }
      }
    ]);

    res.json({
      message: "Database statistics retrieved successfully!",
      totalCompanies: companyCount,
      departmentStats,
      indexes: Object.keys(indexes),
      dataIntegrity: "All data permanently preserved"
    });
  } catch (error) {
    console.error("Error getting database stats:", error);
    res.status(500).json({
      message: "Failed to get database stats: " + error.message
    });
  }
};

// ✅ Delete company (for TPO and Placement Officers with department restrictions)
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { userDepartment, userRole } = req.body; // userRole: 'tpo' or 'coordinator'
    
    if (!id) {
      return res.status(400).json({ message: "Company ID is required" });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Access control based on user role and department
    if (userRole === 'coordinator') {
      // Placement coordinators can only delete companies from their department
      if (company.department !== userDepartment && company.department !== 'ALL') {
        return res.status(403).json({ 
          message: "Access denied. You can only delete companies from your department." 
        });
      }
    }
    // TPOs (userRole === 'tpo') can delete companies from any department

    // Remove the company from database
    await Company.findByIdAndDelete(id);

    // Also remove applications for this company from student placements
    await StudentPlacement.updateMany(
      { "applications.companyId": id },
      { $pull: { applications: { companyId: id } } }
    );

    return res.status(200).json({
      message: "Company deleted successfully",
      deletedCompany: company.companyName
    });

  } catch (error) {
    console.error("Error deleting company:", error);
    return res.status(500).json({
      message: "Failed to delete company: " + error.message
    });
  }
};
