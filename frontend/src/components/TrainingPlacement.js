import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import './TrainingPlacement.css';

const TrainingPlacement = () => {
  const [studentPlacements, setStudentPlacements] = useState([]);
  const [coordinator, setCoordinator] = useState(null);
  const [filter, setFilter] = useState("all");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [customCompanyName, setCustomCompanyName] = useState("");
  const [packageCTC, setPackageCTC] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedDepartmentForCompany, setSelectedDepartmentForCompany] = useState("ALL");
  const [companies, setCompanies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const fetchCoordinatorAndData = async () => {
    const token = localStorage.getItem("token");
    let userRaw = localStorage.getItem("user");
    let user;
    try {
      user = userRaw ? JSON.parse(userRaw) : null;
    } catch {
      user = null;
    }
    if (!user || !token) {
      window.location.href = "/";
      return;
    }
    setCoordinator(user);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/student-placement/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setStudentPlacements(data);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/companies/all");
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

  const fetchDepartmentApplications = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/applications/all`);
      if (res.data.success) {
        setApplications(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
    fetchCoordinatorAndData();
    fetchDepartmentApplications();
  }, [fetchDepartmentApplications]);

  useEffect(() => {
    if (filterCompany) {
      setFilter('all');
    }
  }, [filterCompany]);

  useEffect(() => {
    if (filterDepartment || filterSection) {
      setFilter('all');
    }
  }, [filterDepartment, filterSection]);

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
    try {
      const payload = {
        companyName: finalCompanyName,
        ctc: parseFloat(packageCTC),
        role,
        description,
        department: selectedDepartmentForCompany,
        studentUIDs: selectedStudents
      };
      await axios.post(`http://localhost:5000/api/companies`, payload);
      alert("Company added successfully!");
      setCompanyName("");
      setCustomCompanyName("");
      setPackageCTC("");
      setRole("");
      setDescription("");
      setSelectedStudents([]);
      setSelectedDepartmentForCompany("ALL");
      await fetchCompanies();
    } catch (err) {
      console.error("Error adding company:", err);
      alert(`Failed to add company: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm("Are you sure you want to delete this company? This action cannot be undone.")) {
      return;
    }
    try {
      await axios.delete(`http://localhost:5000/api/companies/${companyId}`, {
        data: {
          userDepartment: 'ALL',
          userRole: 'tpo'
        }
      });
      alert("Company deleted successfully!");
      await fetchCompanies();
    } catch (err) {
      console.error("Error deleting company:", err);
      alert(`Failed to delete company: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDownloadExcel = () => {
    const exportData = studentPlacements.map((s, idx) => ({
      "#": idx + 1,
      Name: s.name,
      UID: s.UID,
      Department: s.department,
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
    let filteredByDepartment = studentPlacements;
    if (filterDepartment) {
      filteredByDepartment = studentPlacements.filter(s => s.department === filterDepartment);
    }
    let filteredBySection = filteredByDepartment;
    if (filterSection) {
      filteredBySection = filteredByDepartment.filter(s => s.section === filterSection);
    }
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
      const response = await axios.put('http://localhost:5000/api/tpos/change-password', {
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

  return (
    <div className="training-placement-container">
      <div className="header-actions">
        <button className="btn btn-warning" onClick={() => setShowPasswordModal(true)}>
          Change Password
        </button>
        <button
          className="btn btn-danger"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/";
          }}
        >
          Logout
        </button>
      </div>

      <div className="welcome-section">
        <h2>Welcome, {coordinator?.name} (Training Placement Officer)</h2>
        <p><strong>Employee ID:</strong> {coordinator?.employeeId}</p>
      </div>

      <div className="filters-section">
        <div className="filters-row">
          <select
            className="filter-dropdown"
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
          >
            <option value="">-- All Departments --</option>
            {[...new Set(studentPlacements.map(s => s.department))].sort().map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            className="filter-dropdown"
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
          >
            <option value="">-- All Sections --</option>
            {[...new Set(studentPlacements.map(s => s.section))].sort().map((section) => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
          <select
            className="filter-dropdown"
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
          >
            <option value="">-- Filter by Company --</option>
            {[...new Set(companies.map(c => c.companyName))].map((companyName) => (
              <option key={companyName} value={companyName}>{companyName}</option>
            ))}
          </select>
        </div>
        <div className="filters-row">
          <div className="filter-buttons">
            <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter("all")}>All Students</button>
            <button className={`filter-btn ${filter === 'applied' ? 'active' : ''}`} onClick={() => setFilter("applied")}>Applied</button>
            <button className={`filter-btn ${filter === 'not_applied' ? 'active' : ''}`} onClick={() => setFilter("not_applied")}>Not Applied</button>
          </div>
          <button className="download-btn" onClick={handleDownloadExcel}>
            Download Excel
          </button>
        </div>
      </div>

      <div className="dashboard-card fadeInUp">
        <div className="card-header">
          <h4>Student List</h4>
          <button className="btn btn-outline-success btn-sm" onClick={handleDownloadExcel}>
            Export Students
          </button>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table className="data-table">
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
                  <th>Department</th>
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
                    <td>{s.department}</td>
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
            {filteredStudents.length === 0 && (
              <div className="empty-state">
                No students found matching your filters.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-card fadeInUp">
        <div className="card-header">
          <h4>Company Management - All Departments (TPO Access)</h4>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table className="data-table">
              <thead>
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
                {companies.map((company, idx) => (
                  <tr key={company._id}>
                    <td>{idx + 1}</td>
                    <td>{company.companyName}</td>
                    <td>{company.role}</td>
                    <td>{company.ctc}</td>
                    <td>
                      <span className={`badge ${company.department === 'ALL' ? 'bg-primary' : 'bg-secondary'}`}>
                        {company.department}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteCompany(company._id)}
                        title="Delete Company"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {companies.length === 0 && (
              <div className="empty-state">
                No companies added yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="add-company-section">
        <h4>Add Company</h4>
        <div className="form-row">
          <div className="form-group">
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
                <option value="TCS (Tata Consultancy Services)">TCS</option>
                <option value="Infosys">Infosys</option>
                <option value="Wipro">Wipro</option>
                <option value="Capgemini India">Capgemini</option>
                <option value="Cognizant Technology Solutions India">Cognizant</option>
              </optgroup>
              <optgroup label="Startup Companies">
                <option value="Zerodha">Zerodha</option>
                <option value="CRED">CRED</option>
                <option value="Swiggy">Swiggy</option>
                <option value="Zomato">Zomato</option>
                <option value="BYJU’S">BYJU'S</option>
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
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                placeholder="Enter Company Name"
                value={customCompanyName}
                onChange={(e) => setCustomCompanyName(e.target.value)}
              />
            </div>
          )}
          <div className="form-group">
            <input
              type="number"
              step="0.1"
              className="form-control"
              placeholder="CTC (LPA)"
              value={packageCTC}
              onChange={(e) => setPackageCTC(e.target.value)}
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              placeholder="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              placeholder="Job Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="form-group">
            <button className="btn btn-success" onClick={handleAddPlacement}>ADD</button>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Target Department:</label>
            <select
              className="form-control"
              value={selectedDepartmentForCompany}
              onChange={(e) => setSelectedDepartmentForCompany(e.target.value)}
            >
              <option value="ALL">ALL Departments</option>
              {[...new Set(studentPlacements.map(s => s.department))].sort().map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="selected-info">
          <strong>Selected Students:</strong> {selectedStudents.length > 0 ? selectedStudents.join(', ') : 'None selected'}
        </div>
      </div>

      {showPasswordModal && (
        <div className="modal">
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
                >×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
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
                <div className="form-group">
                  <label htmlFor="newPassword" className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    placeholder="Enter new password (min 4 chars)"
                  />
                </div>
                <div className="form-group">
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

export default TrainingPlacement;