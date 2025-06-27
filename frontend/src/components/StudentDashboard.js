import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const [student, setStudent] = useState({ name: '', UID: '', department: '', section: '' });
  const [companies, setCompanies] = useState([]);
  const [appliedCompanies, setAppliedCompanies] = useState([]);
  const [showOnlyApplied, setShowOnlyApplied] = useState(false);

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
        const [companiesRes, applicationsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/companies/opportunities?department=${student.department}`),
          axios.get(`http://localhost:5000/api/applications/student/${student.UID}`)
        ]);

        const companiesData = companiesRes.data?.data || [];
        const applications = applicationsRes.data?.data || [];

        setCompanies(companiesData);
        setAppliedCompanies(applications.map(app => app.companyId));
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [student.department, student.UID]);

  const handleApply = async (company) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/applications/apply`, {
        studentUID: student.UID,
        companyId: company._id
      });

      if (response.data.success) {
        alert("Applied successfully!");
        setAppliedCompanies(prev => [...prev, company._id]);
      }
    } catch (err) {
      if (err.response?.status === 400) {
        alert("You have already applied to this company.");
      } else {
        alert("Failed to apply. Please try again.");
      }
      console.error("Apply error:", err);
    }
  };

  const hasAppliedToCompany = (companyId) => appliedCompanies.includes(companyId);

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
        <button
          onClick={() => navigate('/register-placement', { state: { student } })}
          className="register-btn"
        >
          Register for Placement
        </button>
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
                    {hasAppliedToCompany(comp._id) ? (
                      <span className="applied-status">✓ Applied</span>
                    ) : (
                      <button className="apply-button" onClick={() => handleApply(comp)}>
                        Apply
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
