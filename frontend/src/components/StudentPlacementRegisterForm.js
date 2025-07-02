import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import './StudentPlacementRegisterForm.css';

function StudentPlacementRegisterForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const studentData = location.state?.student || {};
  
  const [formData, setFormData] = useState({
    name: "",
    UID: "",
    department: "",
    section: "",
    mailid: "",
    mobile: "",
    relocate: false,
  });
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Auto-populate form with student data when component mounts
  useEffect(() => {
    if (studentData.UID || studentData.department || studentData.name || studentData.section) {
      setFormData(prev => ({
        ...prev,
        name: studentData.name || "",
        UID: studentData.UID || "",
        department: studentData.department || "",
        section: studentData.section || ""
      }));
    }
  }, [studentData]);

  const departmentOptions = [
    { value: "", label: "-- Select Department --" },
    { value: "MCA", label: "MCA" },
    { value: "MBA", label: "MBA" }
  ];

  const getSectionOptions = (dept) => {
    if (dept === "MCA") {
      return [
        { value: "", label: "-- Select Section --" },
        { value: "A", label: "A" },
        { value: "B", label: "B" },
        { value: "DS-A", label: "DS-A" },
        { value: "DS-B", label: "DS-B" }
      ];
    }
    if (dept === "MBA") {
      return [
        { value: "", label: "-- Select Section --" },
        { value: "A", label: "A" },
        { value: "B", label: "B" },
        { value: "BA", label: "BA" }
      ];
    }
    return [{ value: "", label: "-- Select Section --" }];
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    setResume(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!resume) {
      setError("Please upload your resume.");
      return;
    }

    setLoading(true);

    const finalData = new FormData();
    finalData.append("name", formData.name);
    finalData.append("UID", formData.UID);
    finalData.append("department", formData.department);
    finalData.append("section", formData.section);
    finalData.append("mailid", formData.mailid);
    finalData.append("mobile", formData.mobile);
    finalData.append("relocate", formData.relocate);
    finalData.append("resume", resume);

    try {
      await axios.post("http://localhost:5000/api/student-placement/student-placement", finalData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Registration submitted successfully!");
      setError("");
      
      // Redirect to student dashboard after 1 second
      setTimeout(() => {
        navigate('/student-dashboard', { 
          state: { 
            student: studentData,
            message: "Placement registration completed successfully!",
            isSuccess: true // Flag to indicate successful form submission
          } 
        });
      }, 1000);
    } catch {
      setError("Failed to submit registration. Try again.");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card shadow p-4 position-relative">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate('/student-dashboard', { state: { student: studentData } })}
        >
          ← Back
        </button>
        <h2>Placement Registration</h2>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-control"
                  required
                  readOnly={!!studentData.name}
                  style={studentData.name ? { backgroundColor: '#e9ecef', cursor: 'not-allowed' } : {}}
                />
                {studentData.name && (
                  <div className="auto-populated-indicator">Auto-populated from your profile</div>
                )}
              </div>
            </div>

            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">UID *</label>
                <input
                  type="text"
                  name="UID"
                  value={formData.UID}
                  onChange={handleChange}
                  className="form-control"
                  required
                  readOnly={!!studentData.UID}
                  style={studentData.UID ? { backgroundColor: '#e9ecef', cursor: 'not-allowed' } : {}}
                />
                {studentData.UID && (
                  <div className="auto-populated-indicator">Auto-populated from your profile</div>
                )}
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="form-select"
                  required
                  disabled={!!studentData.department}
                  style={studentData.department ? { backgroundColor: '#e9ecef', cursor: 'not-allowed' } : {}}
                >
                  {departmentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {studentData.department && (
                  <div className="auto-populated-indicator">Auto-populated from your profile</div>
                )}
              </div>
            </div>

            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Section *</label>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  className="form-select"
                  required
                  disabled={!!studentData.section}
                  style={studentData.section ? { backgroundColor: '#e9ecef', cursor: 'not-allowed' } : {}}
                >
                  {getSectionOptions(formData.department).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {studentData.section && (
                  <div className="auto-populated-indicator">Auto-populated from your profile</div>
                )}
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  name="mailid"
                  value={formData.mailid}
                  onChange={handleChange}
                  className="form-control"
                  required
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Mobile Number *</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="form-control"
                  maxLength="10"
                  pattern="[0-9]{10}"
                  required
                  placeholder="Enter 10-digit mobile number"
                />
              </div>
            </div>
          </div>

          <div className="mb-3">
            <div className="form-check">
              <input
                type="checkbox"
                name="relocate"
                checked={formData.relocate}
                onChange={handleChange}
                className="form-check-input"
                id="relocateCheck"
              />
              <label htmlFor="relocateCheck" className="form-check-label">
                Willing to Relocate for Job Opportunities
              </label>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="resume" className="form-label">Upload Resume *</label>
            <input
              type="file"
              name="resume"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              className="form-control"
              required
            />
            <div className="text-muted">Supported formats: PDF, DOC, DOCX (Max 5MB)</div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Submitting Registration..." : "Register & Upload Resume"}
          </button>

          {error && <div className="text-danger">{error}</div>}
          {success && (
            <div className="text-success">
              <p>{success}</p>
              <p><small>Redirecting to dashboard...</small></p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default StudentPlacementRegisterForm;
