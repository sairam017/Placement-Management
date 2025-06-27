import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const [student, setStudent] = useState({
    name: '',
    UID: '',
    department: '',
    section: ''
  });

  const [companies, setCompanies] = useState([]);
  const [appliedCompanies, setAppliedCompanies] = useState([]); // To track applied companies
  const [applicationStatuses, setApplicationStatuses] = useState({}); // To track application statuses

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch student data from localStorage
    const fetchStudentData = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/";
        return;
      }

      let storedUser = null;
      try {
        const rawUser = localStorage.getItem("user");
        storedUser = rawUser && rawUser !== 'undefined' ? JSON.parse(rawUser) : null;
      } catch {
        storedUser = null;
      }

      if (storedUser && storedUser.name && storedUser.UID && storedUser.section) {
        setStudent(storedUser);
      } else {
        setStudent({ name: '', UID: '', department: '', section: '' });
      }
    };

    fetchStudentData();
  }, []);

  useEffect(() => {
    // Fetch companies when student.department is available
    const fetchCompanies = async () => {
      if (!student.department) return;
      try {
        const res = await axios.get(`http://localhost:5000/api/companies/opportunities?department=${student.department}`);
        const companiesData = res.data.data || [];
        setCompanies(companiesData);
      } catch (err) {
        console.error('Error fetching companies:', err);
      }
    };

    // Fetch student's applied companies
    const fetchStudentPlacements = async () => {
      if (!student.UID) return;
      try {
        const res = await axios.get(`http://localhost:5000/api/student-placement/${student.UID}`);
        // Expecting a single student placement document with applications array
        const applications = res.data.applications || [];
        const applied = applications.filter(app => app.status !== "not applied").map(app => app.companyId);
        setAppliedCompanies(applied);
        
        // Create status map for all applications
        const statusMap = {};
        applications.forEach(app => {
          statusMap[app.companyId] = app.status;
        });
        setApplicationStatuses(statusMap);
      } catch (err) {
        console.error('Error fetching student placements:', err);
      }
    };

    fetchCompanies();
    fetchStudentPlacements();
  }, [student.department, student.UID]);

  // Update handleApply to use the new status update endpoint
  const handleApply = async (company) => {
    try {
      await axios.post(`http://localhost:5000/api/student-placement/update-status`, {
        UID: Number(student.UID), // Ensure UID is sent as a Number
        companyId: company._id,
        status: "applied"
      });
      setAppliedCompanies(prev => [...prev, company._id]);
      setApplicationStatuses(prev => ({...prev, [company._id]: "applied"}));
      alert("Application status updated to 'Applied'");
    } catch (err) {
      console.error("Error updating application status:", err);
      alert("Failed to update application status.");
    }
  };

  // Function to update application status
  const updateApplicationStatus = async (company, newStatus) => {
    try {
      await axios.post(`http://localhost:5000/api/student-placement/update-status`, {
        UID: Number(student.UID),
        companyId: company._id,
        status: newStatus
      });
      
      if (newStatus !== "not applied") {
        setAppliedCompanies(prev => [...new Set([...prev, company._id])]);
      } else {
        setAppliedCompanies(prev => prev.filter(id => id !== company._id));
      }
      setApplicationStatuses(prev => ({...prev, [company._id]: newStatus}));
      alert(`Application status updated to '${newStatus}'`);
    } catch (err) {
      console.error("Error updating application status:", err);
      alert("Failed to update application status.");
    }
  };

  // Handle status update
  const handleStatusUpdate = async (company, newStatus) => {
    try {
      await axios.post(`http://localhost:5000/api/student-placement/update-status`, {
        UID: Number(student.UID),
        companyId: company._id,
        status: newStatus
      });
      
      // Update local state
      setApplicationStatuses(prev => ({
        ...prev,
        [company._id]: newStatus
      }));
      
      if (newStatus !== "not applied") {
        setAppliedCompanies(prev => {
          if (!prev.includes(company._id)) {
            return [...prev, company._id];
          }
          return prev;
        });
      } else {
        setAppliedCompanies(prev => prev.filter(id => id !== company._id));
      }
      
      alert(`Application status updated to '${newStatus}'`);
    } catch (err) {
      console.error("Error updating application status:", err);
      alert("Failed to update application status.");
    }
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'applied': return '#2196f3';
      case 'interview': return '#ff9800';
      case 'selected': return '#4caf50';
      case 'rejected': return '#f44336';
      case 'offer': return '#9c27b0';
      default: return '#9e9e9e';
    }
  };

  return (
    <div className="student-dashboard">
      {/* Logout Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '1rem' }}>
        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('coordinator');
            window.location.href = '/';
          }}
          style={{
            background: '#f44336',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '0.5rem 1rem',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      {/* Credentials Section */}
      <div className="profile-section">
        <h2>Welcome, {student.name || <span style={{ color: 'red' }}>No Name</span>}</h2>
        <p><strong>UID:</strong> {student.UID || <span style={{ color: 'red' }}>No UID</span>}</p>
        <p><strong>Section:</strong> {student.section || <span style={{ color: 'red' }}>No Section</span>}</p>
        <button
          onClick={() => navigate('/register-placement', { state: { student } })}
          className="register-btn"
        >
          Register for Placement
        </button>
      </div>

      {/* Companies Section */}
      <div className="companies-section" style={{ marginTop: '2rem' }}>
        <h3>On going companies</h3>
        {companies.length === 0 ? (
          <p>No companies available.</p>
        ) : (
          <ul>
            {companies.map((comp) => (
              <li key={comp._id} style={{ marginBottom: '0.5rem', padding: '0.5rem', borderBottom: '1px solid #ccc' }}>
                <strong>{comp.companyName}</strong> - {comp.role}, {comp.ctc} LPA
                <br />
                <em>{comp.description}</em>
                <br />
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold' }}>Status: </span>
                    <span style={{ 
                      color: applicationStatuses[comp._id] === 'applied' ? 'blue' : 
                             applicationStatuses[comp._id] === 'selected' ? 'green' : 
                             applicationStatuses[comp._id] === 'rejected' ? 'red' : 
                             applicationStatuses[comp._id] === 'interview' ? 'orange' : 
                             applicationStatuses[comp._id] === 'offer' ? 'purple' : 'gray' 
                    }}>
                      {applicationStatuses[comp._id] || 'not applied'}
                    </span>
                  </div>
                  <select
                    value={applicationStatuses[comp._id] || 'not applied'}
                    onChange={(e) => handleStatusUpdate(comp, e.target.value)}
                    style={{
                      marginRight: '0.5rem',
                      padding: '0.3rem',
                      borderRadius: '4px',
                      border: '1px solid #ccc'
                    }}
                  >
                    <option value="not applied">Not Applied</option>
                    <option value="applied">Applied</option>
                    <option value="interview">Interview Scheduled</option>
                    <option value="selected">Selected</option>
                    <option value="rejected">Rejected</option>
                    <option value="offer">Offer Received</option>
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
