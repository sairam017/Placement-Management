const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const studentPlacementController = require('../controllers/studentPlacementController');

// ✅ Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'profilePhoto') {
      cb(null, path.join(__dirname, '../uploads/profile_photos'));
    } else {
      cb(null, path.join(__dirname, '../uploads/resumes'));
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// ✅ Register placement with file upload
router.post(
  '/student-placement',
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'profilePhoto', maxCount: 1 }
  ]),
  studentPlacementController.registerPlacement
);

// ✅ Apply for company
router.post('/apply', (req, res, next) => {
  console.log('POST /apply body:', req.body); // Debug log for incoming request
  next();
}, studentPlacementController.applyForCompany);

// ✅ Get students by department
router.get('/department/:department', studentPlacementController.getByDepartment);

// ✅ Get selected students (placeholder)
router.get('/selected', studentPlacementController.getSelectedStudentDetails);

// ✅ Get all student placements
router.get('/all', studentPlacementController.getAllStudentPlacements);

// ✅ Get student by UID (must be last GET route to avoid conflicts)
router.get('/:UID', studentPlacementController.getStudentByUID);

module.exports = router;
