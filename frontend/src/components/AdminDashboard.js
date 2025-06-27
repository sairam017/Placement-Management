import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StudentRegisterForm from './StudentRegisterForm';
import PlacementCoordinatorForm from './PlacementCoordinator';
import TPOForm from './TPOForm';
import './AdminDashboard.css';

const AdminPage = () => {
  const [students, setStudents] = useState([]);
  const [pcs, setPCs] = useState([]);
  const [tpos, setTPOs] = useState([]);

  const [activeTab, setActiveTab] = useState('student'); 

  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showPCForm, setShowPCForm] = useState(false);
  const [showTPOForm, setShowTPOForm] = useState(false);

  useEffect(() => {
    if (activeTab === 'student') fetchStudents();
    else if (activeTab === 'pc') fetchPCs();
    else if (activeTab === 'tpo') fetchTPOs();
  }, [activeTab]);

  const fetchStudents = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/students/all');
      setStudents(res.data.data || []);
    } catch {
      setStudents([]);
    }
  };

  const fetchPCs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/coordinators/coordinators');
      setPCs(res.data.data || []);
    } catch {
      setPCs([]);
    }
  };

  const fetchTPOs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tpos');
      setTPOs(res.data.data || []);
    } catch {
      setTPOs([]);
    }
  };

  return (
    <div className="admin-bg">
      <div className="admin-dashboard-container animate-fade-in">
        <h2 className="dashboard-title">Admin Dashboard - User Management</h2>

        <div className="dashboard-tab-group">
          <button
            className={`dashboard-tab ${activeTab === 'student' ? 'active' : ''}`}
            onClick={() => setActiveTab('student')}
          >
            Students
          </button>
          <button
            className={`dashboard-tab ${activeTab === 'pc' ? 'active' : ''}`}
            onClick={() => setActiveTab('pc')}
          >
            Placement Coordinators
          </button>
          <button
            className={`dashboard-tab ${activeTab === 'tpo' ? 'active' : ''}`}
            onClick={() => setActiveTab('tpo')}
          >
            Training & Placement Officers
          </button>
        </div>

        <hr />

        {activeTab === 'student' && (
          <>
            <button className="reg-btn" onClick={() => setShowStudentForm((v) => !v)}>
              {showStudentForm ? 'Close' : 'Add Student'}
            </button>
            {showStudentForm && (
              <div className="reg-form-box animate-slide-in">
                <h3>Add New Student</h3>
                <StudentRegisterForm onSuccess={() => { setShowStudentForm(false); fetchStudents(); }} />
              </div>
            )}
            <h3>Student List</h3>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>UID</th>
                  <th>Department</th>
                  <th>Section</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.UID}>
                    <td>{s.name}</td>
                    <td>{s.UID}</td>
                    <td>{s.department}</td>
                    <td>{s.section}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {activeTab === 'pc' && (
          <>
            <button className="reg-btn" onClick={() => setShowPCForm((v) => !v)}>
              {showPCForm ? 'Close' : 'Add Placement Coordinator'}
            </button>
            {showPCForm && (
              <div className="reg-form-box animate-slide-in">
                <h3>Add New Placement Coordinator</h3>
                <PlacementCoordinatorForm onSuccess={() => { setShowPCForm(false); fetchPCs(); }} />
              </div>
            )}
            <h3>Placement Coordinators</h3>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                </tr>
              </thead>
              <tbody>
                {pcs.map((pc) => (
                  <tr key={pc.employeeId}>
                    <td>{pc.name}</td>
                    <td>{pc.employeeId}</td>
                    <td>{pc.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {activeTab === 'tpo' && (
          <>
            <button className="reg-btn" onClick={() => setShowTPOForm((v) => !v)}>
              {showTPOForm ? 'Close' : 'Add TPO'}
            </button>
            {showTPOForm && (
              <div className="reg-form-box animate-slide-in">
                <h3>Add New TPO</h3>
                <TPOForm onSuccess={() => { setShowTPOForm(false); fetchTPOs(); }} />
              </div>
            )}
            <h3>Training & Placement Officers</h3>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                </tr>
              </thead>
              <tbody>
                {tpos.map((tpo) => (
                  <tr key={tpo.employeeId}>
                    <td>{tpo.name}</td>
                    <td>{tpo.employeeId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
