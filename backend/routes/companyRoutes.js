const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");

// POST /api/companies - Add new company
router.post("/", companyController.addCompany);

// POST /api/companies/new-round - Create new placement round for existing company
router.post("/new-round", companyController.addStudentsToCompany);

// GET /api/companies/database-stats - Get database statistics (no deletion)
router.get("/database-stats", companyController.getDatabaseStats);

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

// PERMANENT STORAGE ONLY - NO UPDATE/DELETE ROUTES
// All company data is stored permanently and cannot be modified or deleted

module.exports = router;
