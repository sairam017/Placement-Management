import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const [student, setStudent] = useState({ name: '', UID: '', department: '', section: '' });
  const [companies, setCompanies] = useState([]);
  const [appliedCompanies, setAppliedCompanies] = useState([]);
  const [showOnlyApplied, setShowOnlyApplied] = useState(false);
  
  // Update modal states
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    name: '',
    department: '',
    section: '',
    mailid: '',
    mobile: '',
    relocate: false,
    gender: '',
    dob: '',
    address: '',
    pincode: ''
  });
  const [resume, setResume] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      const rawUser = localStorage.getItem("user");
      const storedUser = rawUser && rawUser !== 'undefined' ? JSON.parse(rawUser) : null;
      if (storedUser?.name && storedUser?.UID && storedUser?.section) {
        setStudent(storedUser);
      }
    } catch (err) {
      console.error("Error parsing user from localStorage:", err);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!student.department || !student.UID) return;

      try {
        console.log("Fetching data for student:", student.UID, "department:", student.department);
        
        const [companiesRes, applicationsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/companies/opportunities?department=${student.department}`),
          axios.get(`http://localhost:5000/api/applications/student/${student.UID}`)
        ]);

        const companiesData = companiesRes.data?.data || [];
        const applications = applicationsRes.data?.data || [];

        console.log("Companies fetched:", companiesData);
        console.log("Applications fetched:", applications);

        setCompanies(companiesData);
        
        // Extract company IDs from applications - handle different response structures
        const appliedCompanyIds = applications.map(app => {
          if (typeof app.companyId === 'object' && app.companyId._id) {
            return app.companyId._id;
          }
          return app.companyId;
        });
        
        console.log("Applied company IDs:", appliedCompanyIds);
        setAppliedCompanies(appliedCompanyIds);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [student.department, student.UID]);

  const handleApply = async (company) => {
    try {
      console.log("Applying to company:", company._id, "for student:", student.UID);
      
      const response = await axios.post(`http://localhost:5000/api/applications/apply`, {
        studentUID: student.UID,
        companyId: company._id
      });

      console.log("Application response:", response.data);

      if (response.data.success) {
        alert("Applied successfully!");
        // Update the applied companies list
        setAppliedCompanies(prev => [...prev, company._id]);
      }
    } catch (err) {
      console.error("Apply error:", err);
      console.error("Error response:", err.response?.data);
      
      if (err.response?.status === 400) {
        alert("You have already applied to this company.");
        // If already applied, add to the state to reflect the current status
        setAppliedCompanies(prev => {
          if (!prev.includes(company._id)) {
            return [...prev, company._id];
          }
          return prev;
        });
      } else {
        alert("Failed to apply. Please try again.");
      }
    }
  };

  const hasAppliedToCompany = (companyId) => appliedCompanies.includes(companyId);

  // Function to refresh data
  const refreshData = async () => {
    if (!student.department || !student.UID) return;
    
    try {
      console.log("Refreshing data...");
      
      const [companiesRes, applicationsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/companies/opportunities?department=${student.department}`),
        axios.get(`http://localhost:5000/api/applications/student/${student.UID}`)
      ]);

      const companiesData = companiesRes.data?.data || [];
      const applications = applicationsRes.data?.data || [];

      setCompanies(companiesData);
      
      const appliedCompanyIds = applications.map(app => {
        if (typeof app.companyId === 'object' && app.companyId._id) {
          return app.companyId._id;
        }
        return app.companyId;
      });
      
      setAppliedCompanies(appliedCompanyIds);
      alert("Data refreshed successfully!");
    } catch (err) {
      console.error("Error refreshing data:", err);
      alert("Failed to refresh data.");
    }
  };

  // Function to fetch current placement data
  const fetchCurrentPlacementData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:5000/api/student-placement/${student.UID}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        const data = response.data;
        setUpdateData({
          name: data.name || '',
          department: data.department || '',
          section: data.section || '',
          mailid: data.mailid || '',
          mobile: data.mobile || '',
          relocate: data.relocate || false,
          gender: data.gender || '',
          dob: data.dob ? data.dob.split('T')[0] : '',
          address: data.address || '',
          pincode: data.pincode || ''
        });
      }
    } catch (err) {
      console.error("Error fetching placement data:", err);
      // If no placement data exists, use default values
      setUpdateData({
        name: student.name || '',
        department: student.department || '',
        section: student.section || '',
        mailid: '',
        mobile: '',
        relocate: false,
        gender: '',
        dob: '',
        address: '',
        pincode: ''
      });
    }
  };

  // Function to handle placement update
  const handleUpdatePlacement = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      
      // Add all form fields
      Object.keys(updateData).forEach(key => {
        formData.append(key, updateData[key]);
      });
      
      // Add resume if selected
      if (resume) {
        formData.append('resume', resume);
      }

      const response = await axios.put(
        `http://localhost:5000/api/student-placement/update/${student.UID}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data) {
        alert("Placement registration updated successfully!");
        setShowUpdateModal(false);
        setResume(null);
      }
    } catch (err) {
      console.error("Error updating placement:", err);
      alert(err.response?.data?.message || "Failed to update placement registration.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to open update modal
  const openUpdateModal = () => {
    fetchCurrentPlacementData();
    setShowUpdateModal(true);
  };

  const filteredCompanies = showOnlyApplied
    ? companies.filter((c) => hasAppliedToCompany(c._id))
    : companies;

  return (
    <div className="student-dashboard">
      {/* Logout */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
        <button
          className="logout-btn"
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
        >
          Logout
        </button>
      </div>

      {/* Student Info */}
      <div className="profile-section">
        <h2>Welcome, {student.name || <span style={{ color: 'red' }}>No Name</span>}</h2>
        <p><strong>UID:</strong> {student.UID || <span style={{ color: 'red' }}>No UID</span>}</p>
        <p><strong>Section:</strong> {student.section || <span style={{ color: 'red' }}>No Section</span>}</p>
        <div className="profile-buttons">
          <button
            onClick={() => navigate('/register-placement', { state: { student } })}
            className="register-btn"
          >
            Register for Placement
          </button>
          <button
            onClick={openUpdateModal}
            className="update-btn"
            style={{ marginLeft: '10px', backgroundColor: '#6c757d' }}
          >
            Update Profile
          </button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="filter-buttons">
        <button
          className={!showOnlyApplied ? 'active' : ''}
          onClick={() => setShowOnlyApplied(false)}
        >
          All Companies
        </button>
        <button
          className={showOnlyApplied ? 'active' : ''}
          onClick={() => setShowOnlyApplied(true)}
        >
          Applied Companies
        </button>
      </div>

      {/* Info Section */}
      <div className="info-section">
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
          <strong>Company Sources:</strong> 
          <span className="badge bg-primary ms-2 me-2">Training Placement Officer</span>
          <span className="badge bg-success">Placement Coordinator</span>
        </p>
      </div>

      {/* Companies Table */}
      <div className="companies-table-section">
        <h3>{showOnlyApplied ? "Applied Companies" : "On-going Companies"}</h3>
        {filteredCompanies.length === 0 ? (
          <p>{showOnlyApplied ? "No applied companies." : "No companies available."}</p>
        ) : (
          <table className="companies-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>CTC (LPA)</th>
                <th>Description</th>
                <th>Added By</th>
                <th>Status / Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((comp) => (
                <tr key={comp._id}>
                  <td>{comp.companyName}</td>
                  <td>{comp.role}</td>
                  <td>{comp.ctc}</td>
                  <td>{comp.description}</td>
                  <td>
                    <span className={`badge ${comp.department === 'ALL' ? 'bg-primary' : 'bg-success'}`}>
                      {comp.department === 'ALL' ? 'Training Placement Officer' : 'Placement Coordinator'}
                    </span>
                  </td>
                  <td>
                    {hasAppliedToCompany(comp._id) ? (
                      <span className="applied-status">✓ Applied</span>
                    ) : (
                      <button className="apply-button" onClick={() => handleApply(comp)}>
                        Applied
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Update Placement Modal */}
      {showUpdateModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Placement Registration</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowUpdateModal(false);
                    setResume(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleUpdatePlacement}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="name" className="form-label">Full Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        value={updateData.name}
                        onChange={(e) => setUpdateData({...updateData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="department" className="form-label">Department *</label>
                      <select
                        className="form-control"
                        id="department"
                        value={updateData.department}
                        onChange={(e) => setUpdateData({...updateData, department: e.target.value})}
                        required
                      >
                        <option value="">Select Department</option>
                        <option value="CSE">Computer Science and Engineering</option>
                        <option value="ECE">Electronics and Communication Engineering</option>
                        <option value="EEE">Electrical and Electronics Engineering</option>
                        <option value="MECH">Mechanical Engineering</option>
                        <option value="CIVIL">Civil Engineering</option>
                        <option value="IT">Information Technology</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="section" className="form-label">Section *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="section"
                        value={updateData.section}
                        onChange={(e) => setUpdateData({...updateData, section: e.target.value})}
                        placeholder="e.g., A, B, C"
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="mailid" className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        id="mailid"
                        value={updateData.mailid}
                        onChange={(e) => setUpdateData({...updateData, mailid: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="mobile" className="form-label">Mobile Number *</label>
                      <input
                        type="tel"
                        className="form-control"
                        id="mobile"
                        value={updateData.mobile}
                        onChange={(e) => setUpdateData({...updateData, mobile: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="gender" className="form-label">Gender *</label>
                      <select
                        className="form-control"
                        id="gender"
                        value={updateData.gender}
                        onChange={(e) => setUpdateData({...updateData, gender: e.target.value})}
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="dob" className="form-label">Date of Birth *</label>
                      <input
                        type="date"
                        className="form-control"
                        id="dob"
                        value={updateData.dob}
                        onChange={(e) => setUpdateData({...updateData, dob: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="pincode" className="form-label">Pincode *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="pincode"
                        value={updateData.pincode}
                        onChange={(e) => setUpdateData({...updateData, pincode: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="address" className="form-label">Address *</label>
                    <textarea
                      className="form-control"
                      id="address"
                      rows="3"
                      value={updateData.address}
                      onChange={(e) => setUpdateData({...updateData, address: e.target.value})}
                      required
                    ></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="relocate"
                          checked={updateData.relocate}
                          onChange={(e) => setUpdateData({...updateData, relocate: e.target.checked})}
                        />
                        <label className="form-check-label" htmlFor="relocate">
                          Willing to relocate
                        </label>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="resume" className="form-label">Resume (PDF only)</label>
                      <input
                        type="file"
                        className="form-control"
                        id="resume"
                        accept=".pdf"
                        onChange={(e) => setResume(e.target.files[0])}
                      />
                      <small className="text-muted">Leave empty to keep current resume</small>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowUpdateModal(false);
                      setResume(null);
                    }}
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Updating...' : 'Update Registration'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
