import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const [student, setStudent] = useState({ name: '', UID: '', department: '', section: '' });
  const [companies, setCompanies] = useState([]);
  const [appliedCompanies, setAppliedCompanies] = useState([]);
  const [showOnlyApplied, setShowOnlyApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
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
  const location = useLocation();

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
      if (!student.UID) return;

      try {
        const [companiesRes, applicationsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/companies/student/${String(student.UID)}`),
          axios.get(`http://localhost:5000/api/applications/student/${String(student.UID)}`)
        ]);

        const companiesData = companiesRes.data?.data || [];
        const applications = applicationsRes.data?.data || [];

        setCompanies(companiesData);
        
        const appliedCompanyIds = applications.map(app => {
          let companyId = null;
          if (typeof app.companyId === 'object' && app.companyId && app.companyId._id) {
            companyId = app.companyId._id;
          } else if (app.companyId) {
            companyId = app.companyId;
          }
          return companyId;
        }).filter(id => id);
        
        setAppliedCompanies(appliedCompanyIds);
      } catch (err) {
        console.error("Error fetching data:", err);
        if (err.response?.status === 404) {
          console.log("Student not found in placement data");
        }
      }
    };

    fetchData();
  }, [student.UID, student.department]);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleApply = async (company) => {
    setIsApplying(company._id);
    
    try {
      const response = await axios.post(`http://localhost:5000/api/applications/apply`, {
        studentUID: String(student.UID),
        companyId: company._id
      });

      if (response.data.success) {
        alert("Applied successfully!");
        setAppliedCompanies(prev => [...prev, company._id]);
      }
    } catch (err) {
      console.error("Apply error:", err);
      
      if (err.response?.status === 400 && err.response?.data?.message?.includes("Already applied")) {
        alert("You have already applied to this company.");
        setAppliedCompanies(prev => {
          if (!prev.includes(company._id)) {
            return [...prev, company._id];
          }
          return prev;
        });
      } else {
        alert(`Failed to apply: ${err.response?.data?.message || "Please try again."}`);
      }
    } finally {
      setIsApplying(null);
    }
  };

  const hasAppliedToCompany = (companyId) => {
    return appliedCompanies.includes(companyId);
  };

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

  const handleUpdatePlacement = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      
      Object.keys(updateData).forEach(key => {
        formData.append(key, updateData[key]);
      });
      
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

  const openUpdateModal = () => {
    fetchCurrentPlacementData();
    setShowUpdateModal(true);
  };

  const filteredCompanies = showOnlyApplied
    ? companies.filter((c) => hasAppliedToCompany(c._id))
    : companies;

  return (
    <div className="student-dashboard">
      <div className="dashboard-container">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <h1>Student Dashboard</h1>
          <p>Manage your placement activities and applications</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success">
            {successMessage}
          </div>
        )}

        {/* Student Info */}
        <div className="profile-section">
          <div className="logout-container">
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
          
          <h2>Welcome, {student.name || <span className="missing-data">No Name</span>}</h2>
          
          <div className="credentials-row">
            <p><strong>UID:</strong> {student.UID || <span className="missing-data">No UID</span>}</p>
            <p><strong>Department:</strong> {student.department || <span className="missing-data">No Department</span>}</p>
            <p><strong>Section:</strong> {student.section || <span className="missing-data">No Section</span>}</p>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="action-buttons-row">
          <div className="profile-buttons">
            <button
              onClick={() => navigate('/register-placement', { state: { student } })}
              className="action-btn register-btn"
            >
              Register for Placement
            </button>
            <button
              onClick={openUpdateModal}
              className="action-btn update-btn"
            >
              Update Profile
            </button>
          </div>

          <div className="filter-buttons">
            <button
              className={`filter-btn ${!showOnlyApplied ? 'active' : ''}`}
              onClick={() => setShowOnlyApplied(false)}
            >
              All Companies
            </button>
            <button
              className={`filter-btn ${showOnlyApplied ? 'active' : ''}`}
              onClick={() => setShowOnlyApplied(true)}
            >
              Applied Companies
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="info-section">
          <p className="info-text">
            <strong>Company Sources:</strong> 
            <span className="badge tpo-badge">Training Placement Officer</span>
            <span className="badge coordinator-badge">Placement Coordinator</span>
          </p>
          <p className="info-subtext">
            Companies shown are filtered based on your UID ({student.UID}) and Department ({student.department || 'Not Set'})
          </p>
        </div>

        {/* Companies Table Section */}
        <div className="table-section">
          <h3>{showOnlyApplied ? "Applied Companies" : "Available Companies"}</h3>
          {filteredCompanies.length === 0 ? (
            <div className="no-companies-message">
              {showOnlyApplied ? (
                <p>You haven't applied to any companies yet.</p>
              ) : (
                <div>
                  <p>No companies are currently available for your profile:</p>
                  <p><strong>UID:</strong> {student.UID} | <strong>Department:</strong> {student.department || 'Not Set'}</p>
                  <p className="availability-info">
                    Companies will appear here when they are assigned to:
                  </p>
                  <ul className="availability-list">
                    <li>Your specific UID ({student.UID})</li>
                    <li>Your department ({student.department || 'Not Set'})</li>
                    <li>All departments (by TPO)</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="table-responsive">
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
                        <span className={`badge ${comp.department === 'ALL' ? 'tpo-badge' : 'coordinator-badge'}`}>
                          {comp.department === 'ALL' ? 'Training Placement Officer' : 'Placement Coordinator'}
                        </span>
                      </td>
                      <td>
                        {hasAppliedToCompany(comp._id) ? (
                          <span className="applied-status">
                            ✓ Applied
                          </span>
                        ) : (
                          <button 
                            className={`apply-button ${isApplying === comp._id ? 'applying' : ''}`}
                            onClick={() => handleApply(comp)}
                            disabled={isApplying === comp._id}
                          >
                            {isApplying === comp._id ? 'Applying...' : 'Apply'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Update Placement Modal */}
        {showUpdateModal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h5 className="modal-title">Update Placement Registration</h5>
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => {
                    setShowUpdateModal(false);
                    setResume(null);
                  }}
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleUpdatePlacement}>
                <div className="modal-body">
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="name">Full Name *</label>
                      <input
                        type="text"
                        id="name"
                        value={updateData.name}
                        onChange={(e) => setUpdateData({...updateData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="department">Department *</label>
                      <select
                        id="department"
                        value={updateData.department}
                        onChange={(e) => setUpdateData({...updateData, department: e.target.value})}
                        required
                      >
                        <option value="">-- Select Department --</option>
                        <option value="MCA">MCA</option>
                        <option value="MBA">MBA</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="section">Section *</label>
                      <input
                        type="text"
                        id="section"
                        value={updateData.section}
                        onChange={(e) => setUpdateData({...updateData, section: e.target.value})}
                        placeholder="e.g., A, B, C"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="mailid">Email *</label>
                      <input
                        type="email"
                        id="mailid"
                        value={updateData.mailid}
                        onChange={(e) => setUpdateData({...updateData, mailid: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="mobile">Mobile Number *</label>
                      <input
                        type="tel"
                        id="mobile"
                        value={updateData.mobile}
                        onChange={(e) => setUpdateData({...updateData, mobile: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="gender">Gender *</label>
                      <select
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
                    <div className="form-group">
                      <label htmlFor="dob">Date of Birth *</label>
                      <input
                        type="date"
                        id="dob"
                        value={updateData.dob}
                        onChange={(e) => setUpdateData({...updateData, dob: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="pincode">Pincode *</label>
                      <input
                        type="text"
                        id="pincode"
                        value={updateData.pincode}
                        onChange={(e) => setUpdateData({...updateData, pincode: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group full-width">
                      <label htmlFor="address">Address *</label>
                      <textarea
                        id="address"
                        rows="3"
                        value={updateData.address}
                        onChange={(e) => setUpdateData({...updateData, address: e.target.value})}
                        required
                      ></textarea>
                    </div>
                    <div className="form-group checkbox-group">
                      <input
                        type="checkbox"
                        id="relocate"
                        checked={updateData.relocate}
                        onChange={(e) => setUpdateData({...updateData, relocate: e.target.checked})}
                      />
                      <label htmlFor="relocate">Willing to relocate</label>
                    </div>
                    <div className="form-group file-group">
                      <label htmlFor="resume">Resume (PDF only)</label>
                      <input
                        type="file"
                        id="resume"
                        accept=".pdf"
                        onChange={(e) => setResume(e.target.files[0])}
                      />
                      <small>Leave empty to keep current resume</small>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="cancel-btn"
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
                    className="submit-btn"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Updating...' : 'Update Registration'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;