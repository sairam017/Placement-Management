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
      console.log(`Filtered by section '${filterSection}':`, filteredBySection.length, 'students');
    }
    
    // Then filter by company - show only students who are eligible for the selected company
    if (filterCompany) {
      console.log(`Filtering by company: '${filterCompany}'`);
      
      // Find the selected company to get its studentUIDs
      const selectedCompany = companies.find(c => c.companyName === filterCompany);
      
      if (selectedCompany && selectedCompany.studentUIDs && selectedCompany.studentUIDs.length > 0) {
        // Filter students to show only those whose UIDs are in the company's studentUIDs array
        filteredBySection = filteredBySection.filter(student => 
          selectedCompany.studentUIDs.includes(parseInt(student.UID))
        );
        console.log(`Students eligible for ${filterCompany}:`, filteredBySection.length);
        console.log('Eligible student UIDs from company:', selectedCompany.studentUIDs);
      } else if (selectedCompany && (!selectedCompany.studentUIDs || selectedCompany.studentUIDs.length === 0)) {
        // If company has no specific students assigned, show all students from the department
        console.log(`Company ${filterCompany} has no specific students assigned, showing all department students`);
      } else {
        console.log(`Company ${filterCompany} not found in companies list`);
        // If company not found, show no students
        filteredBySection = [];
      }
      
      // Now apply the filter buttons (applied/not_applied) on the company-eligible students
      if (filter === "applied") {
        const result = filteredBySection.filter((s) => hasStudentAppliedToCompany(s.UID, filterCompany));
        console.log(`Students applied to ${filterCompany}:`, result.length);
        return result;
      } else if (filter === "not_applied") {
        const result = filteredBySection.filter((s) => !hasStudentAppliedToCompany(s.UID, filterCompany));
        console.log(`Students NOT applied to ${filterCompany}:`, result.length);
        return result;
      } else {
        // "All Students" - return all eligible students for the company
        console.log(`All eligible students for ${filterCompany}:`, filteredBySection.length);
        return filteredBySection;
      }
    } else {
      // No company filter - use existing logic
      if (filter === "applied") {
        const result = filteredBySection.filter((s) => hasStudentAnyApplication(s.UID));
        console.log(`Students with any application:`, result.length);
        return result;
      } else if (filter === "not_applied") {
        const result = filteredBySection.filter((s) => !hasStudentAnyApplication(s.UID));
        console.log(`Students with no applications:`, result.length);
        return result;
      } else {
        console.log(`All students:`, filteredBySection.length);
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
      await axios.put('http://localhost:5000/api/coordinators/change-password', {
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
    <div className="placement-dashboard">
      {/* Header Section */}
      <div className="header-section">
        <div className="welcome-text">
          <h2>Welcome, {coordinator?.name}</h2>
          <p>Department: {coordinator?.department}</p>
        </div>
        <button className="logout-btn" onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("coordinator");
          window.location.href = "/";
        }}>
          Logout
        </button>
      </div>

      {/* Filter Controls Row */}
      <div className="filter-row">
  <select className="filter-dropdown" value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)}>
    <option value="">-- Filter by Company --</option>
    {companies.map((company) => (
      <option key={company._id} value={company.companyName}>
        {company.companyName}
      </option>
    ))}
  </select>

  <select className="filter-dropdown" value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
    <option value="">-- Filter by Section --</option>
    {[...new Set(studentPlacements.map(s => s.section))].sort().map((section) => (
      <option key={section} value={section}>
        {section}
      </option>
    ))}
  </select>

  <div className="filter-buttons">
    <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter("all")}>
      All Students
    </button>
    <button className={`filter-btn ${filter === 'applied' ? 'active' : ''}`} onClick={() => setFilter("applied")}>
      Applied
    </button>
    <button className={`filter-btn ${filter === 'not_applied' ? 'active' : ''}`} onClick={() => setFilter("not_applied")}>
      Not Applied
    </button>
  </div>

  <button className="download-btn" onClick={handleDownloadExcel}>
    Download Excel
  </button>
</div>

      {/* Filter Information */}
      {filterCompany && (
        <div className="filter-info">
          <p>
            Showing {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} 
            {(() => {
              const selectedCompany = companies.find(c => c.companyName === filterCompany);
              if (selectedCompany && selectedCompany.studentUIDs && selectedCompany.studentUIDs.length > 0) {
                return ` eligible for ${filterCompany}`;
              } else {
                return ` for ${filterCompany} (all department students)`;
              }
            })()}
          </p>
        </div>
      )}

      {/* Students Table */}
      <div className="students-section">
        {loading ? (
          <div className="loading-state">Loading...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : (
          <div className="table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={handleSelectAllStudents}
                    />
                  </th>
                  <th>S.No</th>
                  <th>Name</th>
                  <th>UID</th>
                  <th>Section</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Relocate</th>
                  <th>Resume</th>
                  <th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr key={student.UID}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.UID)}
                        onChange={() => handleStudentSelect(student.UID)}
                      />
                    </td>
                    <td>{index + 1}</td>
                    <td>{student.name}</td>
                    <td>{student.UID}</td>
                    <td>{student.section}</td>
                    <td>{student.mailid}</td>
                    <td>{student.mobile}</td>
                    <td>{student.relocate ? "Yes" : "No"}</td>
                    <td>
                      {student.resumeUrl ? (
                        <a 
                          href={`http://localhost:5000${student.resumeUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="resume-link"
                        >
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      {filterCompany
                        ? hasStudentAppliedToCompany(student.UID, filterCompany) ? "Yes" : "No"
                        : hasStudentAnyApplication(student.UID) ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Placement Section */}
      <div className="add-placement-section">
        <h3>Add Placement</h3>
        <div className="placement-form">
          <input
            type="text"
            placeholder="Selected UIDs"
            className="form-input uid-input"
            value={selectedStudents.join(', ')}
            readOnly
          />
          <select
            className="form-input company-select"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          >
            <option value="">Select Company</option>
            <optgroup label="MNC Companies">
              <option value="Google India">Google India</option>
              <option value="Microsoft India">Microsoft India</option>
              <option value="Amazon India">Amazon India</option>
              <option value="TCS (Tata Consultancy Services)">TCS (Tata Consultancy Services)</option>
              <option value="Infosys">Infosys</option>
              <option value="Wipro">Wipro</option>
            </optgroup>
            <optgroup label="Startup Companies">
              <option value="Zerodha">Zerodha</option>
              <option value="CRED">CRED</option>
              <option value="Others">Others</option>
            </optgroup>
          </select>
          {companyName === "Others" && (
            <input
              type="text"
              className="form-input"
              placeholder="Enter Company Name"
              value={customCompanyName}
              onChange={(e) => setCustomCompanyName(e.target.value)}
            />
          )}
          <input
            type="number"
            step="0.1"
            className="form-input"
            placeholder="CTC (LPA)"
            value={packageCTC}
            onChange={(e) => setPackageCTC(e.target.value)}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button className="add-btn" onClick={handleAddPlacement}>
            Add
          </button>
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
