const express = require("express");
const router = express.Router();

const {
  createCoordinator,
  getAllCoordinators,
  getCoordinatorById,
  updateCoordinator,
  loginCoordinator,
  changePassword
} = require("../controllers/coordinatorController");

// Routes - PERMANENT STORAGE ONLY
router.post("/coordinator", createCoordinator);
router.get("/coordinators", getAllCoordinators);
router.get("/coordinator/:id", getCoordinatorById);
router.put("/coordinator/:id", updateCoordinator);     // Update allowed for user management
// DELETE route removed - NO DELETION ALLOWED
router.post("/login", loginCoordinator);
router.put("/change-password", changePassword);

module.exports = router;
