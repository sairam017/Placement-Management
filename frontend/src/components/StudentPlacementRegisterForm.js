import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './StudentPlacementRegisterForm.css';

function StudentPlacementRegisterForm() {
  const navigate = useNavigate();
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
      
      // Redirect to student dashboard after successful registration
      setTimeout(() => {
        navigate("/student-dashboard");
      }, 2000); // Wait 2 seconds to show success message
    } catch {
      setError("Failed to submit registration. Try again.");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="card shadow p-4 position-relative" style={{ maxWidth: "600px", margin: "auto" }}>
        <button
          type="button"
          className="btn btn-outline-secondary back-button"
          onClick={() => window.history.back()}
        >
          ← Back
        </button>
        <h2 className="text-center mb-4">Placement Registration</h2>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="mb-3">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="mb-3">
            <label>UID</label>
            <input
              type="text"
              name="UID"
              value={formData.UID}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="mb-3">
            <label>Department</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="form-select"
              required
            >
              {departmentOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label>Section</label>
            <select
              name="section"
              value={formData.section}
              onChange={handleChange}
              className="form-select"
              required
            >
              {getSectionOptions(formData.department).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label>Email</label>
            <input
              type="email"
              name="mailid"
              value={formData.mailid}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="mb-3">
            <label>Mobile Number</label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              className="form-control"
              maxLength="10"
              pattern="[0-9]{10}"
              required
            />
          </div>

          <div className="mb-3 form-check">
            <input
              type="checkbox"
              name="relocate"
              checked={formData.relocate}
              onChange={handleChange}
              className="form-check-input"
              id="relocateCheck"
            />
            <label htmlFor="relocateCheck" className="form-check-label">
              Willing to Relocate?
            </label>
          </div>

          <div className="mb-3">
            <label htmlFor="resume">Upload Resume (PDF/DOC/DOCX)</label>
            <input
              type="file"
              name="resume"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              className="form-control"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Register & Send Resume"}
          </button>

          {error && <p className="text-danger mt-3 text-center">{error}</p>}
          {success && <p className="text-success mt-3 text-center">{success}</p>}
        </form>
      </div>
    </div>
  );
}

export default StudentPlacementRegisterForm;
