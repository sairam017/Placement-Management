import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import './PlacementDashboard.css'; // Assuming you have a CSS file for styling

const PlacementDashboard = () => {
  const [studentPlacements, setStudentPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coordinator, setCoordinator] = useState(null);
  const [filter, setFilter] = useState("all");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterSection, setFilterSection] = useState(""); // Add section filter
  const [companyName, setCompanyName] = useState("");
  const [customCompanyName, setCustomCompanyName] = useState("");
  const [packageCTC, setPackageCTC] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [companies, setCompanies] = useState([]); // List of companies from backend
  const [applications, setApplications] = useState([]); // Store all applications
  
  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const fetchCoordinatorAndData = async () => {
    const token = localStorage.getItem("token");
    let coordRaw = localStorage.getItem("coordinator");
    let coord;
    try {
      coord = coordRaw ? JSON.parse(coordRaw) : null;
    } catch {
      coord = null;
    }
    if (!coord || !token) {
      window.location.href = "/";
      return;
    }
    setCoordinator(coord);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/student-placement/department/${coord.department}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = Array.isArray(res.data) ? res.data : [];
      setStudentPlacements(data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/companies/all");
      console.log("Companies response:", res.data); // Debug log
      let list = [];
      if (Array.isArray(res.data.data)) {
        list = res.data.data;
      } else if (Array.isArray(res.data)) {
        list = res.data;
      }
      setCompanies(list);
    } catch (err) {
      console.error("Error fetching companies:", err);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchDepartmentApplications = useCallback(async () => {
    if (!coordinator?.department) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/applications/department/${coordinator.department}`);
      if (res.data.success) {
        setApplications(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching department applications:', err);
    }
  }, [coordinator?.department]);

  useEffect(() => {
    fetchCoordinatorAndData();
    fetchDepartmentApplications();
  }, [fetchDepartmentApplications]); // Now safe to add as dependency

  useEffect(() => {
    if (filterCompany) {
      setFilter('all');
    }
  }, [filterCompany]);

  useEffect(() => {
    if (filterSection) {
      setFilter('all');
    }
  }, [filterSection]);

  const handleAddPlacement = async () => {
    const finalCompanyName = companyName === "Others" ? customCompanyName : companyName;
    
    if (!finalCompanyName || !packageCTC || !role || !description) {
      alert("Please fill all required fields (Company Name, CTC, Role, Description).");
      return;
    }
    if (companyName === "Others" && !customCompanyName.trim()) {
      alert("Please enter a custom company name.");
      return;
    }
    if (!coordinator?.department) {
      alert("Department information is missing.");
      return;
    }
    try {
      const payload = {
        companyName: finalCompanyName,
        ctc: parseFloat(packageCTC),
        role,
        description,
        department: coordinator.department,
        studentUIDs: selectedStudents
      };
      console.log("Sending payload:", payload); // Debug log
      const response = await axios.post(`http://localhost:5000/api/companies`, payload);
      console.log("Response:", response.data); // Debug log
      alert("Company added successfully!");
      setCompanyName("");
      setCustomCompanyName("");
      setPackageCTC("");
      setRole("");
      setDescription("");
      setSelectedStudents([]);
      // Refresh companies list
      await fetchCompanies();
    } catch (err) {
      console.error("Error adding company:", err);
      console.error("Error response:", err.response?.data); // Debug log
      alert(`Failed to add company: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDownloadExcel = () => {
    const exportData = studentPlacements.map((s, idx) => ({
      "#": idx + 1,
      Name: s.name,
      UID: s.UID,
      Section: s.section,
      MailID: s.mailid,
      Mobile: s.mobile,
      Relocate: s.relocate ? "Yes" : "No",
      ResumeURL: s.resumeUrl ? `http://localhost:5000${s.resumeUrl}` : "-"
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Placements");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "placements.xlsx");
  };

  const handleStudentSelect = (uid) => {
    setSelectedStudents(prev => {
      if (prev.includes(uid)) {
        return prev.filter(id => id !== uid);
      } else {
        return [...prev, uid];
      }
    });
  };

  const handleSelectAllStudents = () => {
    if (selectedStudents.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.UID));
    }
  };

  const hasStudentAppliedToCompany = (studentUID, companyName) => {
    return applications.some(app => 
      app.studentUID === studentUID.toString() && app.companyName === companyName
    );
  };

  const hasStudentAnyApplication = (studentUID) => {
    return applications.some(app => app.studentUID === studentUID.toString());
  };

  const getFilteredStudents = () => {
    let filteredBySection = studentPlacements;
    
    // Filter by section first
    if (filterSection) {
      filteredBySection = studentPlacements.filter(s => s.section === filterSection);
    }
    
    // Then filter by company and application status
    if (filterCompany) {
      if (filter === "applied") {
        return filteredBySection.filter((s) => hasStudentAppliedToCompany(s.UID, filterCompany));
      } else if (filter === "not_applied") {
        return filteredBySection.filter((s) => !hasStudentAppliedToCompany(s.UID, filterCompany));
      } else {
        return filteredBySection;
      }
    } else {
      if (filter === "applied") {
        return filteredBySection.filter((s) => hasStudentAnyApplication(s.UID));
      } else if (filter === "not_applied") {
        return filteredBySection.filter((s) => !hasStudentAnyApplication(s.UID));
      } else {
        return filteredBySection;
      }
    }
  };

  const filteredStudents = getFilteredStudents();

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert("Please fill all password fields.");
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New password and confirm password don't match.");
      return;
    }
    
    if (passwordData.newPassword.length < 4) {
      alert("New password must be at least 4 characters long.");
      return;
    }

    try {
      const response = await axios.put('http://localhost:5000/api/coordinators/change-password', {
        employeeId: coordinator.employeeId,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      alert("Password changed successfully!");
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error("Error changing password:", err);
      alert(`Failed to change password: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteCompany = async (companyId, companyDepartment) => {
    // Check if coordinator can delete this company (only their own department companies)
    if (companyDepartment !== coordinator?.department) {
      alert("You can only delete companies from your department. TPO companies (ALL departments) cannot be deleted by coordinators.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this company? This action cannot be undone.")) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/companies/${companyId}`, {
        data: {
          userDepartment: coordinator?.department,
          userRole: 'coordinator'
        }
      });
      alert("Company deleted successfully!");
      
      // Refresh companies list
      const companiesRes = await axios.get("http://localhost:5000/api/companies/all");
      if (Array.isArray(companiesRes.data.data)) {
        setCompanies(companiesRes.data.data);
      }

    } catch (err) {
      console.error("Error deleting company:", err);
      alert(`Failed to delete company: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="container mt-4 position-relative">
      <div className="d-flex justify-content-end position-absolute" style={{ top: 0, right: 0 }}>
        <button
          className="btn btn-warning me-2"
          onClick={() => setShowPasswordModal(true)}
        >
          Change Password
        </button>
        <button
          className="btn btn-danger"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("coordinator");
            window.location.href = "/";
          }}
        >
          Logout
        </button>
      </div>
      <h2>Welcome, {coordinator?.name}</h2>
      <p><strong>Department:</strong> {coordinator?.department}</p>

      <div className="d-flex justify-content-between mb-3 align-items-center">
        <div className="d-flex align-items-center">
          {/* Section Filter Dropdown */}
          <select
            className="form-select form-select-sm me-2"
            style={{ width: 180, display: "inline-block" }}
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
          >
            <option value="">-- All Sections --</option>
            {[...new Set(studentPlacements.map(s => s.section))].sort().map((section) => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
          {/* Company Filter Dropdown */}
          <select
            className="form-select form-select-sm me-2"
            style={{ width: 220, display: "inline-block" }}
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
          >
            <option value="">-- Filter by Company --</option>
            {[...new Set(companies.map(c => c.companyName))].map((companyName) => (
              <option key={companyName} value={companyName}>{companyName}</option>
            ))}
          </select>
          <button
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
            onClick={() => setFilter("all")}
            type="button"
          >
            All Students
          </button>
          <button
            className={`btn btn-sm ${filter === 'applied' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
            onClick={() => setFilter("applied")}
            type="button"
          >
            Applied
          </button>
          <button
            className={`btn btn-sm ${filter === 'not_applied' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilter("not_applied")}
            type="button"
          >
            Not Applied
          </button>
        </div>
        <div className="d-flex align-items-center">
          <button className="btn btn-outline-success me-2" onClick={handleDownloadExcel} type="button">
            Download Excel
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                  onChange={handleSelectAllStudents}
                />
              </th>
              <th>#</th>
              <th>Name</th>
              <th>UID</th>
              <th>Section</th>
              <th>Mail</th>
              <th>Mobile</th>
              <th>Relocate</th>
              <th>Resume</th>
              <th>Applied</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s, idx) => (
              <tr key={s.UID}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(s.UID)}
                    onChange={() => handleStudentSelect(s.UID)}
                  />
                </td>
                <td>{idx + 1}</td>
                <td>{s.name}</td>
                <td>{s.UID}</td>
                <td>{s.section}</td>
                <td>{s.mailid}</td>
                <td>{s.mobile}</td>
                <td>{s.relocate ? "Yes" : "No"}</td>
                <td>
                  {s.resumeUrl ? (
                    <a href={`http://localhost:5000${s.resumeUrl}`} target="_blank" rel="noopener noreferrer">View</a>
                  ) : "-"}
                </td>
                <td>
                  {filterCompany
                    ? hasStudentAppliedToCompany(s.UID, filterCompany) ? "Yes" : "No"
                    : hasStudentAnyApplication(s.UID) ? "Yes" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Company Management Section */}
      <div className="card mb-4">
        <div className="card-header">
          <h4>Company Management - {coordinator?.department} Department</h4>
        </div>
        <div className="card-body">
          <div className="table-responsive" style={{ maxHeight: "300px", overflowY: "auto" }}>
            <table className="table table-sm table-bordered">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Company Name</th>
                  <th>Role</th>
                  <th>CTC (LPA)</th>
                  <th>Department</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {companies
                  .filter(company => 
                    company.department === coordinator?.department || 
                    company.department === 'ALL'
                  )
                  .map((company, idx) => (
                  <tr key={company._id}>
                    <td>{idx + 1}</td>
                    <td>{company.companyName}</td>
                    <td>{company.role}</td>
                    <td>{company.ctc}</td>
                    <td>
                      <span className={`badge ${company.department === 'ALL' ? 'bg-warning text-dark' : 'bg-primary'}`}>
                        {company.department === 'ALL' ? 'ALL (TPO)' : company.department}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteCompany(company._id, company.department)}
                        title={company.department === coordinator?.department 
                          ? "Delete Company" 
                          : "Cannot delete - Not your department or TPO company"}
                        disabled={company.department !== coordinator?.department}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <h4>Add Company</h4>
      <div className="row g-2 mb-3">
        <div className="col-md-3">
          <select
            className="form-control"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          >
            <option value="">Select Company</option>
            <optgroup label="MNC Companies">
              <option value="Google India">Google India</option>
              <option value="Microsoft India">Microsoft India</option>
              <option value="Amazon India">Amazon India</option>
              <option value="IBM India">IBM India</option>
              <option value="Accenture India">Accenture India</option>
              <option value="TCS (Tata Consultancy Services)">TCS (Tata Consultancy Services)</option>
              <option value="Infosys">Infosys</option>
              <option value="Wipro">Wipro</option>
              <option value="Capgemini India">Capgemini India</option>
              <option value="Cognizant Technology Solutions India">Cognizant Technology Solutions India</option>
            </optgroup>
            <optgroup label="Startup Companies">
              <option value="Zerodha">Zerodha</option>
              <option value="CRED">CRED</option>
              <option value="Swiggy">Swiggy</option>
              <option value="Zomato">Zomato</option>
              <option value="BYJU’S">BYJU’S</option>
              <option value="Unacademy">Unacademy</option>
              <option value="Razorpay">Razorpay</option>
              <option value="PhonePe">PhonePe</option>
              <option value="Groww">Groww</option>
              <option value="Meesho">Meesho</option>
              <option value="Delhivery">Delhivery</option>
              <option value="Nykaa">Nykaa</option>
              <option value="OYO Rooms">OYO Rooms</option>
              <option value="Boat">Boat</option>
              <option value="Udaan">Udaan</option>
              <option value="Others">Others</option>
            </optgroup>
          </select>
        </div>
        {companyName === "Others" && (
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Enter Company Name"
              value={customCompanyName}
              onChange={(e) => setCustomCompanyName(e.target.value)}
            />
          </div>
        )}
        <div className="col-md-2">
          <input
            type="number"
            step="0.1"
            className="form-control"
            placeholder="CTC (LPA)"
            value={packageCTC}
            onChange={(e) => setPackageCTC(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <input
            type="text"
            className="form-control"
            placeholder="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <input
            type="text"
            className="form-control"
            placeholder="Job Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <button className="btn btn-success" onClick={handleAddPlacement}>
            ADD
          </button>
        </div>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-md-12">
          <div className="alert alert-info">
            <strong>Selected Students:</strong> {selectedStudents.length > 0 ? selectedStudents.join(', ') : 'None selected'}
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Change Password</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="currentPassword" className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    placeholder="Enter new password (min 4 characters)"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleChangePassword}
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementDashboard;