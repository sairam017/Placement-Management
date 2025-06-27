const express = require("express");
const router = express.Router();

const {
  createCoordinator,
  getAllCoordinators,
  getCoordinatorById,
  updateCoordinator,
  deleteCoordinator,
  loginCoordinator
} = require("../controllers/coordinatorController");

router.post("/coordinator", createCoordinator);
router.get("/coordinators", getAllCoordinators);
router.get("/coordinator/:id", getCoordinatorById);
router.put("/coordinator/:id", updateCoordinator);
router.delete("/coordinator/:id", deleteCoordinator);
router.post("/login", loginCoordinator);

module.exports = router;
