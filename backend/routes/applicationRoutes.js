const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");

// POST /api/applications/apply - Apply to company
router.post("/apply", applicationController.applyToCompany);

// GET /api/applications/student/:studentUID - Get applications by student
router.get("/student/:studentUID", applicationController.getApplicationsByStudent);

// GET /api/applications/company/:companyId - Get applications by company
router.get("/company/:companyId", applicationController.getApplicationsByCompany);

// GET /api/applications/department/:department - Get applications by department
router.get("/department/:department", applicationController.getApplicationsByDepartment);

// GET /api/applications/all - Get all applications
router.get("/all", applicationController.getAllApplications);

// GET /api/applications/check/:studentUID/:companyId - Check if student applied to company
router.get("/check/:studentUID/:companyId", applicationController.checkApplicationStatus);

// GET /api/applications/stats - Get application statistics
router.get("/stats", applicationController.getApplicationStats);

module.exports = router;
