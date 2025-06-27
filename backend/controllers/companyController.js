const Company = require("../models/Company");
const StudentPlacement = require("../models/studentPlacementModel");

// Helper function to check and clean old indexes
const checkAndCleanIndexes = async () => {
  try {
    const indexes = await Company.collection.getIndexes();
    console.log("Current indexes on Company collection:", indexes);
    
    // Drop problematic indexes that contain 'placements.student.UID'
    const indexesToDrop = Object.keys(indexes).filter(indexName => 
      indexName.includes('placements.student.UID') || 
      indexName.includes('placements')
    );
    
    for (const indexName of indexesToDrop) {
      if (indexName !== '_id_') { // Don't drop the default _id index
        try {
          await Company.collection.dropIndex(indexName);
          console.log(`Dropped problematic index: ${indexName}`);
        } catch (error) {
          console.log(`Could not drop index ${indexName}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error("Error checking/cleaning indexes:", error);
  }
};

// Add a new company or update existing company with new students
exports.addCompany = async (req, res) => {
  const { companyName, role, ctc, description, department, studentUIDs } = req.body;

  console.log("Received data:", req.body); // Debug log

  // Validate required fields
  if (!companyName || !role || !ctc || !description || !department) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Clean up old indexes if this is the first time we encounter the error
    await checkAndCleanIndexes();
    
    // Check if company with same name, role, and department already exists
    const existingCompany = await Company.findOne({
      companyName: companyName.trim(),
      role: role.trim(),
      department: department.trim()
    });

    if (existingCompany) {
      // If company exists, add new student UIDs to existing array (avoid duplicates)
      const newStudentUIDs = Array.isArray(studentUIDs) ? studentUIDs : [];
      const updatedStudentUIDs = [...new Set([...existingCompany.studentUIDs, ...newStudentUIDs])];
      
      existingCompany.studentUIDs = updatedStudentUIDs;
      existingCompany.ctc = parseFloat(ctc); // Update CTC if needed
      existingCompany.description = description.trim(); // Update description if needed
      
      const updatedCompany = await existingCompany.save();
      console.log("Company updated with new students:", updatedCompany._id);
      
      return res.status(200).json({ 
        message: "Company updated successfully with new students!", 
        company: updatedCompany,
        action: "updated"
      });
    } else {
      // Create new company if it doesn't exist
      const newCompany = new Company({
        companyName: companyName.trim(),
        role: role.trim(),
        ctc: parseFloat(ctc),
        description: description.trim(),
        department: department.trim(),
        studentUIDs: Array.isArray(studentUIDs) ? studentUIDs : []
      });

      const savedCompany = await newCompany.save();
      console.log("New company created:", savedCompany._id);
      
      return res.status(201).json({ 
        message: "Company added successfully!", 
        company: savedCompany,
        action: "created"
      });
    }
  } catch (error) {
    console.error("Error adding/updating company:", error);
    
    if (error.code === 11000) {
      // Handle specific case of old placements.student.UID index
      if (error.message.includes('placements.student.UID')) {
        console.log("Detected old index issue. Attempting to clean up...");
        try {
          await Company.collection.dropIndex('placements.student.UID_1');
          console.log("Dropped problematic index. Please try again.");
          return res.status(400).json({ 
            message: "Database index cleaned up. Please try adding the company again.",
            action: "retry_needed"
          });
        } catch (dropError) {
          console.error("Could not drop index:", dropError);
        }
      }
      
      // Get more details about which field caused the duplicate
      const duplicateKey = error.keyPattern ? Object.keys(error.keyPattern)[0] : 'unknown';
      const duplicateValue = error.keyValue ? error.keyValue[duplicateKey] : 'unknown';
      
      console.log("Duplicate key error details:", {
        keyPattern: error.keyPattern,
        keyValue: error.keyValue,
        duplicateKey,
        duplicateValue
      });
      
      return res.status(400).json({ 
        message: `Database constraint error: ${duplicateKey}`,
        details: {
          duplicateField: duplicateKey,
          duplicateValue: duplicateValue,
          suggestion: "Please try again or contact administrator"
        }
      });
    }
    
    return res.status(500).json({ 
      message: "Failed to add company: " + error.message 
    });
  }
};

// ✅ Fetch companies by department
exports.getCompaniesByDepartment = async (req, res) => {
  try {
    const dept = req.query.department;
    const companies = await Company.find({ department: dept });
    res.json({ data: companies });
  } catch (error) {
    console.error("Error fetching companies by department:", error);
    res.status(500).json({ message: "Failed to fetch companies." });
  }
};

// ✅ Fetch all companies (optional utility)
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    res.json({ data: companies });
  } catch (error) {
    console.error("Error fetching all companies:", error);
    res.status(500).json({ message: "Failed to fetch companies." });
  }
};

// Get students who applied to a specific company
exports.getApplicantsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    if (!companyId) {
      return res.status(400).json({ message: "companyId is required" });
    }
    // Find students where applications array contains the companyId and status is not "not applied"
    const applicants = await StudentPlacement.find(
      { 
        "applications.companyId": companyId,
        "applications.status": { $ne: "not applied" }
      },
      // Only return relevant fields
      "name UID section department mailid mobile relocate resumeUrl applications"
    );
    res.status(200).json(applicants);
  } catch (error) {
    console.error("Error fetching applicants by company:", error);
    res.status(500).json({ message: "Failed to fetch applicants." });
  }
};

// Add students to an existing company
exports.addStudentsToCompany = async (req, res) => {
  const { companyId, studentUIDs } = req.body;

  if (!companyId || !Array.isArray(studentUIDs) || studentUIDs.length === 0) {
    return res.status(400).json({ 
      message: "Company ID and student UIDs array are required" 
    });
  }

  try {
    const company = await Company.findById(companyId);
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Add new student UIDs to existing array (avoid duplicates)
    const updatedStudentUIDs = [...new Set([...company.studentUIDs, ...studentUIDs])];
    company.studentUIDs = updatedStudentUIDs;
    
    const updatedCompany = await company.save();
    
    return res.status(200).json({
      message: "Students added to company successfully!",
      company: updatedCompany,
      newStudentsAdded: studentUIDs.filter(uid => !company.studentUIDs.includes(uid))
    });
  } catch (error) {
    console.error("Error adding students to company:", error);
    return res.status(500).json({ 
      message: "Failed to add students: " + error.message 
    });
  }
};

// Utility function to manually clean database indexes
exports.cleanupDatabase = async (req, res) => {
  try {
    console.log("Starting database cleanup...");
    
    // Get all current indexes
    const indexes = await Company.collection.getIndexes();
    console.log("Current indexes:", Object.keys(indexes));
    
    // Drop all indexes except _id
    const indexNames = Object.keys(indexes);
    const droppedIndexes = [];
    
    for (const indexName of indexNames) {
      if (indexName !== '_id_') {
        try {
          await Company.collection.dropIndex(indexName);
          droppedIndexes.push(indexName);
          console.log(`✅ Dropped index: ${indexName}`);
        } catch (error) {
          console.log(`❌ Could not drop index ${indexName}:`, error.message);
        }
      }
    }
    
    // Recreate only the indexes we want
    try {
      await Company.collection.createIndex({ 
        companyName: 1, 
        role: 1, 
        department: 1 
      }, { unique: false });
      console.log("✅ Created new compound index");
    } catch (error) {
      console.log("❌ Could not create new index:", error.message);
    }
    
    res.json({
      message: "Database cleanup completed!",
      droppedIndexes,
      action: "cleanup_completed"
    });
  } catch (error) {
    console.error("Error during database cleanup:", error);
    res.status(500).json({ 
      message: "Database cleanup failed: " + error.message 
    });
  }
};
