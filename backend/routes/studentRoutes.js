const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");

// Create student
router.post("/create", studentController.createStudent);

// Login
router.post("/login", studentController.loginStudent);

// Get all students
router.get("/all", studentController.getAllStudents);

// Get by UID
router.get("/uid/:uid", studentController.getStudentByUID);

// Get students by department (for dashboard)
router.get("/department/:department", studentController.getStudentsByDepartment);

module.exports = router;
