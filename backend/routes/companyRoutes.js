const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");

// POST /api/companies - Add new company
router.post("/", companyController.addCompany);

// GET /api/companies/opportunities?department=XYZ - Get companies by department
router.get("/opportunities", companyController.getCompaniesByDepartment);

// GET /api/companies/all - Get all companies
router.get("/all", companyController.getAllCompanies);

// GET /api/companies/applicants/:companyId - Get applicants for a company
router.get("/applicants/:companyId", companyController.getApplicantsByCompany);

// GET /api/companies/:id - Get company by ID
router.get("/:id", async (req, res) => {
  try {
    const Company = require("../models/Company");
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/companies/:id - Update company
router.put("/:id", async (req, res) => {
  try {
    const Company = require("../models/Company");
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.json({ message: "Company updated successfully", company });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/companies/:id - Delete company
router.delete("/:id", async (req, res) => {
  try {
    const Company = require("../models/Company");
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.json({ message: "Company deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// EMERGENCY: Reset companies collection
router.post("/reset-collection", async (req, res) => {
  try {
    const Company = require("../models/Company");
    
    // Drop the entire companies collection
    await Company.collection.drop();
    console.log("Companies collection dropped");
    
    // Recreate the collection with proper schema
    await Company.createCollection();
    console.log("Companies collection recreated");
    
    res.json({ message: "Companies collection reset successfully" });
  } catch (error) {
    console.error("Error resetting collection:", error);
    res.status(500).json({ message: "Failed to reset collection" });
  }
});

module.exports = router;
