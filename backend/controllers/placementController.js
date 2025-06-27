// controllers/placementController.js
const Placement = require("../models/placementModel");
const Student = require("../models/studentModel");
const Company = require("../models/Company");

exports.addPlacement = async (req, res) => {
  let { studentUID, companyName, ctc, role, description } = req.body;
  const studentUIDs = Array.isArray(studentUID) ? studentUID : [studentUID];
  let results = [];

  try {
    for (const uid of studentUIDs) {
      const student = await Student.findOne({ UID: uid });
      if (!student) {
        results.push({ uid, status: "Student not found" });
        continue;
      }

      let company = await Company.findOne({ companyName, department: student.department });
      if (!company) {
        company = new Company({
          companyName,
          description: description || "",
          department: student.department
        });
        await company.save();
      }

      const newPlacement = new Placement({
        studentUID: uid,
        companyName,
        ctc,
        role,
        department: student.department,
        description: description || ""
      });
      await newPlacement.save();

      results.push({ uid, status: "Placement added" });
    }

    return res.status(201).json({ message: "Placement(s) processed", results });
  } catch (err) {
    console.error("Error adding placement:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getAllPlacements = async (req, res) => {
  try {
    const placements = await Placement.find();
    return res.json({ data: placements });
  } catch (err) {
    console.error("Error fetching placements:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getPlacementsByDepartment = async (req, res) => {
  const dept = req.params.dept;
  try {
    const placements = await Placement.find({ department: dept });
    return res.json({ data: placements });
  } catch (err) {
    console.error("Error fetching placements:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getCompaniesByDepartment = async (req, res) => {
  const dept = req.params.dept;
  try {
    const companies = await Company.find({ department: dept });
    return res.json({ data: companies });
  } catch (err) {
    console.error("Error fetching companies:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getPlacementsByStudent = async (req, res) => {
  const { studentUID, department } = req.query;
  if (!studentUID || !department) {
    return res.status(400).json({ message: "studentUID and department are required" });
  }
  try {
    const placements = await Placement.find({ studentUID, department });
    return res.json({ data: placements });
  } catch (err) {
    console.error("Error fetching placements by studentUID:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.deletePlacement = async (req, res) => {
  const id = req.params.id;
  try {
    const placement = await Placement.findByIdAndDelete(id);
    if (!placement) {
      return res.status(404).json({ message: "Placement not found" });
    }
    return res.json({ message: "Placement deleted successfully" });
  } catch (err) {
    console.error("Error deleting placement:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
