const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");

// POST /api/companies
router.post("/", companyController.addCompany);

// ✅ GET /api/companies/opportunities?department=XYZ
router.get("/opportunities", companyController.getCompaniesByDepartment);

// ✅ GET /api/companies/all
router.get("/all", companyController.getAllCompanies);

// GET /api/companies/applicants/:companyId
router.get("/applicants/:companyId", companyController.getApplicantsByCompany);

module.exports = router;
