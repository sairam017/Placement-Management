const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");

// POST /api/companies
router.post("/", companyController.addCompany);

// ✅ GET /api/companies/opportunities?department=XYZ
router.get("/opportunities", companyController.getCompaniesByDepartment);

// ✅ GET /api/companies/student/:studentUID - Get companies accessible to specific student
router.get("/student/:studentUID", companyController.getCompaniesByStudentUID);

// ✅ GET /api/companies/all
router.get("/all", companyController.getAllCompanies);

// GET /api/companies/applicants/:companyId
router.get("/applicants/:companyId", companyController.getApplicantsByCompany);

// POST /api/companies/add-students - Add students to existing company
router.post("/add-students", companyController.addStudentsToCompany);

// GET /api/companies/stats - Get database statistics
router.get("/stats", companyController.getDatabaseStats);

// DELETE /api/companies/:id - Delete company
router.delete("/:id", companyController.deleteCompany);

module.exports = router;
