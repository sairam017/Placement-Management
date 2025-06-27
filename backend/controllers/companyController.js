const Company = require("../models/Company");
const StudentPlacement = require("../models/studentPlacementModel");

// Add a new company
exports.addCompany = async (req, res) => {
  const { companyName, role, ctc, description, department, studentUIDs } = req.body;

  console.log("Received data:", req.body); // Debug log

  // Validate required fields
  if (!companyName || !role || !ctc || !description || !department) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newCompany = new Company({
      companyName: companyName.trim(),
      role: role.trim(),
      ctc: parseFloat(ctc),
      description: description.trim(),
      department: department.trim(),
      studentUIDs: Array.isArray(studentUIDs) ? studentUIDs : []
    });

    const savedCompany = await newCompany.save();
    console.log("Company saved successfully:", savedCompany._id);
    
    return res.status(201).json({ 
      message: "Company added successfully!", 
      company: savedCompany 
    });
  } catch (error) {
    console.error("Error adding company:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "Company with this information already exists" 
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
