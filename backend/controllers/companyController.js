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
