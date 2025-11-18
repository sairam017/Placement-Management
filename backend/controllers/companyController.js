const Company = require("../models/Company");
const StudentPlacement = require("../models/studentPlacementModel");
const { sendMail } = require('../utils/mailer');

// Helper for environment-aware logging
const isDev = process.env.NODE_ENV !== 'production';

// Debug only – safe, does not delete anything
const logCurrentIndexes = async () => {
  try {
    const indexes = await Company.collection.getIndexes();
    // No logging
  } catch (error) {
    // No error logging
  }
};

// ✅ Add new company (no overwriting, no deletion)
exports.addCompany = async (req, res) => {
  const { companyName, role, ctc, description, department, studentUIDs, companyWebsite, applicationLink } = req.body;

  if (!companyName || !role || !ctc || !description || !department) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    await logCurrentIndexes();

    const newCompany = new Company({
      companyName: companyName.trim(),
      role: role.trim(),
      ctc: parseFloat(ctc),
      description: description.trim(),
      department: department.trim(),
      studentUIDs: Array.isArray(studentUIDs) ? studentUIDs : [],
      companyWebsite: companyWebsite || '',
      applicationLink: applicationLink || '',
      createdAt: new Date()
    });

    const savedCompany = await newCompany.save();

    // Prepare notification
    const notification = {
      title: `New Placement: ${savedCompany.companyName}`,
      message: savedCompany.description,
      companyId: savedCompany._id,
      companyName: savedCompany.companyName,
      role: savedCompany.role,
      ctc: savedCompany.ctc,
      applicationLink: savedCompany.applicationLink || '',
      companyWebsite: savedCompany.companyWebsite || '',
      read: false,
      createdAt: new Date()
    };

    // Determine recipients: ONLY notify specific UIDs if provided (selected students only)
    let studentsToNotify = [];
    if (Array.isArray(savedCompany.studentUIDs) && savedCompany.studentUIDs.length > 0) {
      studentsToNotify = await StudentPlacement.find({ UID: { $in: savedCompany.studentUIDs } });
    } else {
      // No specific UIDs provided -> do not send emails/notifications automatically (avoid department-wide spams)
      console.log(`ℹ️ No studentUIDs provided for ${savedCompany.companyName}; skipping notifications/emails.`);
      return res.status(201).json({
        message: "Company placement opportunity added successfully (no notifications sent - no selected students).",
        company: savedCompany,
        action: "created",
        permanent: true
      });
    }

    // Log recipients info
    try {
      const total = studentsToNotify.length;
      const withEmail = studentsToNotify.filter(s => s.mailid).length;
      console.log(`📣 Notifying ${total} students (${withEmail} with email addresses) for company ${savedCompany.companyName}`);
    } catch (e) {
      // ignore
    }

    // Push notification to student documents (non-blocking)
    try {
      const ids = studentsToNotify.map(s => s._id);
      if (ids.length > 0) {
        await StudentPlacement.updateMany(
          { _id: { $in: ids } },
          { $push: { notifications: notification } }
        );
      }
    } catch (err) {
      // Don't fail the main request for notification write errors
      console.error('Failed to write notifications to students:', err?.message || err);
    }

    // Send emails asynchronously (do not block response) and collect results
  let emailResults = { sent: 0, failed: 0, previews: [] };
    try {
      const appLink = savedCompany.applicationLink && savedCompany.applicationLink.trim()
        ? savedCompany.applicationLink.trim()
        : `http://localhost:3000/student-dashboard?companyId=${savedCompany._id}`;

      const companySite = savedCompany.companyWebsite && savedCompany.companyWebsite.trim()
        ? `<p>Company website: <a href="${savedCompany.companyWebsite}" target="_blank" rel="noopener">${savedCompany.companyWebsite}</a></p>`
        : '';

      const emailPromises = studentsToNotify.map(async (student) => {
        if (!student.mailid) {
          console.log(`⚠️ Skipping email for UID ${student.UID} - no mailid`);
          return { status: 'skipped' };
        }
        const to = student.mailid;
        const subject = `Placements Dept: New Opportunity - ${savedCompany.companyName}`;
        const html = `<p>Dear ${student.name || 'Student'},</p>
          <p><strong>You got a new chance to join <em>${savedCompany.companyName}</em>!</strong></p>
          <p>Role: ${savedCompany.role} &nbsp;|&nbsp; CTC: ${savedCompany.ctc} LPA</p>
          <p>${savedCompany.description}</p>
          ${companySite}
          <p>Apply here: <a href="${appLink}" target="_blank" rel="noopener">Complete Application Form</a></p>
          <p>Regards,<br/>Placements Dept</p>`;
        try {
          const r = await sendMail({ to, subject, html });
          if (r && r.success) return { status: 'sent', to, info: r.info, preview: r.previewUrl };
          return { status: 'failed', to, error: r.error || 'unknown' };
        } catch (err) {
          return { status: 'failed', to, error: err?.message || err };
        }
      });

      const results = await Promise.all(emailPromises);
      results.forEach(r => {
        if (!r) return;
        if (r.status === 'sent') {
          emailResults.sent++;
          if (r.preview) emailResults.previews.push(r.preview);
        } else if (r.status === 'skipped') {
          // skipped
        } else emailResults.failed++;
      });
    } catch (err) {
      console.error('Error sending notification emails:', err?.message || err);
    }

    return res.status(201).json({
      message: "Company placement opportunity added successfully!",
      company: savedCompany,
      action: "created",
      permanent: true,
      notifications: {
        recipients: studentsToNotify.length,
        emails: emailResults
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to add company: " + error.message,
      permanent: true
    });
  }
};

// ✅ Get companies by department
exports.getCompaniesByDepartment = async (req, res) => {
  try {
    const dept = req.query.department;
    
    // Find companies for the specific department OR for "ALL" departments (added by TPO)
    const companies = await Company.find({ 
      $or: [
        { department: dept },
        { department: "ALL" }
      ]
    });
    
    res.json({ data: companies });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch companies." });
  }
};

// ✅ Get companies accessible to a specific student UID
exports.getCompaniesByStudentUID = async (req, res) => {
  try {
    const { studentUID } = req.params;
    const studentUIDNumber = parseInt(studentUID);
    
    // No logging
    
    if (!studentUIDNumber) {
      return res.status(400).json({ 
        success: false, 
        message: "Valid student UID is required" 
      });
    }

    // First, get the student's department from StudentPlacement collection
    const StudentPlacement = require("../models/studentPlacementModel");
    let studentDepartment = null;
    
    try {
      const studentData = await StudentPlacement.findOne({ UID: studentUIDNumber });
      if (studentData) {
        studentDepartment = studentData.department;
        // No logging
      }
    } catch (err) {
      // No logging
    }

    // STRICT UID-BASED FILTERING: Show companies ONLY if:
    // 1. Student UID is SPECIFICALLY listed in studentUIDs array
    // 2. OR department is "ALL" (TPO companies for all students)
    // 3. OR company department matches student department AND studentUIDs is empty (for backward compatibility)
    let searchCriteria = [
      { studentUIDs: studentUIDNumber },  // Exact UID match only
      { department: "ALL" }               // TPO companies for all students
    ];

    // Add department-based matching only if student department is found and for companies with empty studentUIDs
    if (studentDepartment) {
      searchCriteria.push({
        department: studentDepartment,
        studentUIDs: { $size: 0 }  // Only if no specific students assigned
      });
    }

    // No logging

    const companies = await Company.find({
      $or: searchCriteria
    }).sort({ createdAt: -1 });
    
    // No logging
    
    res.json({ 
      success: true,
      data: companies,
      count: companies.length,
      studentUID: studentUIDNumber,
      studentDepartment: studentDepartment
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch companies." 
    });
  }
};

// ✅ Get all companies
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    res.json({ data: companies });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch companies." });
  }
};

// ✅ Get applicants by company (filtering on applications array)
exports.getApplicantsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    if (!companyId) {
      return res.status(400).json({ message: "companyId is required" });
    }

    const applicants = await StudentPlacement.find(
      {
        "applications.companyId": companyId,
        "applications.status": { $ne: "not applied" }
      },
      "name UID section department mailid mobile relocate resumeUrl applications"
    );

    res.status(200).json(applicants);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch applicants." });
  }
};

// ✅ Add students to an existing company (no overwrite, creates new round)
exports.addStudentsToCompany = async (req, res) => {
  const { companyId, studentUIDs } = req.body;

  if (!companyId || !Array.isArray(studentUIDs) || studentUIDs.length === 0) {
    return res.status(400).json({
      message: "Company ID and student UIDs array are required"
    });
  }

  try {
    const originalCompany = await Company.findById(companyId);
    if (!originalCompany) {
      return res.status(404).json({ message: "Company not found" });
    }

    const newCompanyEntry = new Company({
      companyName: originalCompany.companyName,
      role: originalCompany.role,
      ctc: originalCompany.ctc,
      description: originalCompany.description,
      department: originalCompany.department,
      studentUIDs,
      createdAt: new Date(),
      batch: new Date().getTime()
    });

    const savedCompany = await newCompanyEntry.save();

    // Prepare notification for this new round
    const notification = {
      title: `New Placement Round: ${savedCompany.companyName}`,
      message: savedCompany.description,
      companyId: savedCompany._id,
      companyName: savedCompany.companyName,
      role: savedCompany.role,
      ctc: savedCompany.ctc,
      applicationLink: savedCompany.applicationLink || '',
      companyWebsite: savedCompany.companyWebsite || '',
      read: false,
      createdAt: new Date()
    };

    // Find students by UIDs and push notifications
    let studentsToNotify = await StudentPlacement.find({ UID: { $in: studentUIDs } });
    try {
      const ids = studentsToNotify.map(s => s._id);
      const total = studentsToNotify.length;
      const withEmail = studentsToNotify.filter(s => s.mailid).length;
      console.log(`📣 Notifying ${total} students ( ${withEmail} with email ) for new round of ${savedCompany.companyName}`);
      if (ids.length > 0) {
        await StudentPlacement.updateMany(
          { _id: { $in: ids } },
          { $push: { notifications: notification } }
        );
      }
    } catch (err) {
      console.error('Failed to write notifications for new round:', err?.message || err);
    }

    // Send emails to the selected students
  let emailResults = { sent: 0, failed: 0, previews: [] };
    try {
      const appLink = savedCompany.applicationLink && savedCompany.applicationLink.trim()
        ? savedCompany.applicationLink.trim()
        : `http://localhost:3000/student-dashboard?companyId=${savedCompany._id}`;

      const companySite = savedCompany.companyWebsite && savedCompany.companyWebsite.trim()
        ? `<p>Company website: <a href="${savedCompany.companyWebsite}" target="_blank" rel="noopener">${savedCompany.companyWebsite}</a></p>`
        : '';

      const emailPromises = studentsToNotify.map(async (student) => {
        if (!student.mailid) {
          console.log(`⚠️ Skipping email for UID ${student.UID} - no mailid`);
          return { status: 'skipped' };
        }
        const to = student.mailid;
        const subject = `Placements Dept: You're invited - ${savedCompany.companyName}`;
        const html = `<p>Dear ${student.name || 'Student'},</p>
          <p><strong>You have been added to a new placement round for <em>${savedCompany.companyName}</em>.</strong></p>
          <p>Role: ${savedCompany.role} &nbsp;|&nbsp; CTC: ${savedCompany.ctc} LPA</p>
          <p>${savedCompany.description}</p>
          ${companySite}
          <p>Apply here: <a href="${appLink}" target="_blank" rel="noopener">Complete Application Form</a></p>
          <p>Regards,<br/>Placements Dept</p>`;
        try {
          const r = await sendMail({ to, subject, html });
          if (r && r.success) return { status: 'sent', to, info: r.info, preview: r.previewUrl };
          return { status: 'failed', to, error: r.error || 'unknown' };
        } catch (err) {
          return { status: 'failed', to, error: err?.message || err };
        }
      });

      const results = await Promise.all(emailPromises);
      results.forEach(r => {
        if (!r) return;
        if (r.status === 'sent') {
          emailResults.sent++;
          if (r.preview) emailResults.previews.push(r.preview);
        } else if (r.status === 'skipped') {
          // skipped
        } else emailResults.failed++;
      });
    } catch (err) {
      console.error('Error sending emails for new round:', err?.message || err);
    }

    return res.status(201).json({
      message: "New placement round created successfully!",
      company: savedCompany,
      originalCompanyId: companyId,
      action: "new_round_created",
      permanent: true,
      notifications: {
        recipients: studentsToNotify.length,
        emails: emailResults
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create new placement round: " + error.message
    });
  }
};

// ✅ Database info (no mutations)
exports.getDatabaseStats = async (req, res) => {
  try {
    // No logging
    const indexes = await Company.collection.getIndexes();
    const companyCount = await Company.countDocuments();
    const departmentStats = await Company.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
          companies: {
            $push: {
              name: "$companyName",
              role: "$role",
              studentsCount: { $size: "$studentUIDs" }
            }
          }
        }
      }
    ]);
    res.json({
      message: "Database statistics retrieved successfully!",
      totalCompanies: companyCount,
      departmentStats,
      indexes: Object.keys(indexes),
      dataIntegrity: "All data permanently preserved"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get database stats: " + error.message
    });
  }
};

// ✅ Delete company (for TPO and Placement Officers with department restrictions)
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { userDepartment, userRole } = req.body; // userRole: 'tpo' or 'coordinator'
    
    if (!id) {
      return res.status(400).json({ message: "Company ID is required" });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Access control based on user role and department
    if (userRole === 'coordinator') {
      // Placement coordinators can only delete companies from their department
      if (company.department !== userDepartment && company.department !== 'ALL') {
        return res.status(403).json({ 
          message: "Access denied. You can only delete companies from your department." 
        });
      }
    }
    // TPOs (userRole === 'tpo') can delete companies from any department

    // Remove the company from database
    await Company.findByIdAndDelete(id);

    // Also remove applications for this company from student placements
    await StudentPlacement.updateMany(
      { "applications.companyId": id },
      { $pull: { applications: { companyId: id } } }
    );

    return res.status(200).json({
      message: "Company deleted successfully",
      deletedCompany: company.companyName
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete company: " + error.message
    });
  }
};
