
const express = require("express");
const router = express.Router();

const coordinatorController = require("../controllers/coordinatorController");
const {
  createCoordinator,
  getAllCoordinators,
  getCoordinatorById,
  updateCoordinator,
  loginCoordinator,
  changePassword
} = coordinatorController;

// Get unique departments (for login dropdown)
router.get("/departments", coordinatorController.getDepartments);

// Routes - PERMANENT STORAGE ONLY
router.post("/coordinator", createCoordinator);
router.get("/coordinators", getAllCoordinators);
router.get("/coordinator/:id", getCoordinatorById);
router.put("/coordinator/:id", updateCoordinator);     // Update allowed for user management
router.delete("/coordinator/:id", coordinatorController.deleteCoordinator); // Delete coordinator by UID
router.post("/login", loginCoordinator);
router.put("/change-password", changePassword);

module.exports = router;
