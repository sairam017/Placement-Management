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
        const applied = applications.filter(app => app.applied).map(app => app.companyId);
        setAppliedCompanies(applied);
      } catch (err) {
        console.error('Error fetching student placements:', err);
      }
    };

    fetchCompanies();
    fetchStudentPlacements();
  }, [student.department, student.UID]);

  // Update handleApply to use the correct endpoint and payload
  const handleApply = async (company) => {
    try {
      await axios.post(`http://localhost:5000/api/student-placement/apply`, {
        UID: Number(student.UID), // Ensure UID is sent as a Number
        companyId: company._id
      });
      setAppliedCompanies(prev => [...prev, company._id]);
    } catch (err) {
      console.error("Error applying for company:", err);
      alert("Failed to apply for this company.");
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
                  <button
                    onClick={() => {
                      if (!appliedCompanies.includes(comp._id)) {
                        handleApply(comp);
                      }
                    }}
                    style={{
                      background: appliedCompanies.includes(comp._id) ? 'green' : '#2196f3',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.3rem 0.8rem',
                      cursor: appliedCompanies.includes(comp._id) ? 'default' : 'pointer',
                      marginRight: '0.5rem'
                    }}
                    disabled={appliedCompanies.includes(comp._id)}
                  >
                    {appliedCompanies.includes(comp._id) ? 'Applied' : 'applied'}
                  </button>
                  <button
                    style={{
                      background: '#9e9e9e',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.3rem 0.8rem',
                      cursor: 'not-allowed'
                    }}
                    disabled
                  >
                    Not Applied
                  </button>
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
