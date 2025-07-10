const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const authMiddleware = require("../middleware/authMiddleware");

// Create student (Admin only)
router.post("/create", authMiddleware.verifyToken, studentController.createStudent);

// Bulk create students (Admin only)
router.post("/bulk", authMiddleware.verifyToken, studentController.bulkCreateStudents);

// Login
router.post("/login", studentController.loginStudent);

// Get all students (Admin only)
router.get("/all", authMiddleware.verifyToken, studentController.getAllStudents);

// Get by UID (Admin only)
router.get("/uid/:uid", authMiddleware.verifyToken, studentController.getStudentByUID);

// Get students by department (for dashboard)
router.get("/department/:department", studentController.getStudentsByDepartment);

// Delete student by UID (Admin only)
router.delete("/:uid", authMiddleware.verifyToken, studentController.deleteStudent);

module.exports = router;
