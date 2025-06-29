const express = require("express");
const {
  createTPO,
  getAllTPOs,
  getTPOById,
  updateTPO,
  deleteTPO,
  loginTPO,
  changeTPOPassword
} = require("../controllers/tpoController");

const router = express.Router();

// Routes
router.post("/", createTPO);               // POST /api/tpos
router.get("/", getAllTPOs);               // GET /api/tpos
router.post("/login", loginTPO);           // POST /api/tpos/login
router.put("/change-password", changeTPOPassword); // PUT /api/tpos/change-password (must be before /:id routes)
router.get("/:id", getTPOById);            // GET /api/tpos/:id
router.put("/:id", updateTPO);             // PUT /api/tpos/:id
router.delete("/:id", deleteTPO);          // DELETE /api/tpos/:id

module.exports = router;
