// routes/placementRoutes.js
const express = require("express");
const router = express.Router();
const placementController = require("../controllers/placementController");

// Add new placement
router.post("/placements", placementController.addPlacement);

// Get all placements
router.get("/placements", placementController.getAllPlacements);

// Get placements by department
router.get("/placements/department/:dept", placementController.getPlacementsByDepartment);

// Get companies by department
router.get("/companies/department/:dept", placementController.getCompaniesByDepartment);

// Get placements by studentUID + department
router.get("/placements/by-student", placementController.getPlacementsByStudent);

// Delete placement
router.delete("/placements/:id", placementController.deletePlacement);

module.exports = router;
