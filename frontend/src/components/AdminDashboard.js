import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import StudentRegisterForm from './StudentRegisterForm';
import PlacementCoordinatorForm from './PlacementCoordinator';
import TrainingPlacementRegisterForm from './TrainingPlacementRegisterForm';
import './AdminDashboard.css';

const AdminPage = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [pcs, setPCs] = useState([]);
  const [tpos, setTPOs] = useState([]);
  const [adminData, setAdminData] = useState(null);

  const [activeTab, setActiveTab] = useState('student'); 
  const [studentFilter, setStudentFilter] = useState('all');

  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showPCForm, setShowPCForm] = useState(false);
  const [showTPOForm, setShowTPOForm] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const storedAdminData = localStorage.getItem('adminData');
    
    if (!token || !storedAdminData) {
      alert('Please login as admin first');
      navigate('/');
      return;
    }
    
    setAdminData(JSON.parse(storedAdminData));
  }, [navigate]);

  // Configure axios defaults for authenticated requests
  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/');
  };

  useEffect(() => {
    if (activeTab === 'student') fetchStudents();
    else if (activeTab === 'pc') fetchPCs();
    else if (activeTab === 'tpo') fetchTPOs();
  }, [activeTab]);

  useEffect(() => {
    filterStudents();
  }, [students, studentFilter]);

  const filterStudents = () => {
    if (studentFilter === 'all') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        student.department?.toLowerCase() === studentFilter.toLowerCase()
      );
      setFilteredStudents(filtered);
    }
  };

  const getUniqueDepartments = () => {
    const departments = [...new Set(students.map(s => s.department).filter(d => d))];
    return departments.sort();
  };

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

  const deleteStudent = async (uid) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await axios.delete(`http://localhost:5000/api/students/${uid}`);
        alert('Student deleted successfully');
        fetchStudents();
      } catch (error) {
        alert('Error deleting student: ' + (error.response?.data?.message || 'Server error'));
      }
    }
  };

  const deletePC = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this Placement Coordinator?')) {
      try {
        await axios.delete(`http://localhost:5000/api/coordinators/${employeeId}`);
        alert('Placement Coordinator deleted successfully');
        fetchPCs();
      } catch (error) {
        alert('Error deleting Placement Coordinator: ' + (error.response?.data?.message || 'Server error'));
      }
    }
  };

  const deleteTPO = async (tpoId) => {
    if (window.confirm('Are you sure you want to delete this Training & Placement Officer?')) {
      try {
        await axios.delete(`http://localhost:5000/api/tpos/${tpoId}`);
        alert('Training & Placement Officer deleted successfully');
        fetchTPOs();
      } catch (error) {
        alert('Error deleting TPO: ' + (error.response?.data?.message || 'Server error'));
      }
    }
  };

  return (
    <div className="admin-bg">
      <div className="admin-dashboard-container animate-fade-in">
        {/* Admin Header */}
        {adminData && (
          <div className="admin-header" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '20px', 
            padding: '15px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <div>
              <h4 style={{ margin: 0, color: '#28a745' }}>
                Welcome, {adminData.name}
              </h4>
              <small style={{ color: '#6c757d' }}>
                UID: {adminData.uid} | Role: {adminData.role}
              </small>
            </div>
            <button 
              onClick={handleLogout}
              className="btn btn-outline-danger btn-sm"
              style={{ minWidth: '80px' }}
            >
              Logout
            </button>
          </div>
        )}
        
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
            <div className="action-section">
              <button className="add-btn primary" onClick={() => setShowStudentForm((v) => !v)}>
                <span className="btn-icon">+</span>
                {showStudentForm ? 'Close Form' : 'Add Student'}
              </button>
              
              <div className="filter-section">
                <label htmlFor="department-filter" className="filter-label">Filter by Department:</label>
                <select 
                  id="department-filter"
                  className="filter-select"
                  value={studentFilter} 
                  onChange={(e) => setStudentFilter(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  {getUniqueDepartments().map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <div className="student-count">
                  <span className="count-badge">
                    {filteredStudents.length} of {students.length} students
                  </span>
                </div>
              </div>
            </div>

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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.UID}>
                    <td>{s.name}</td>
                    <td>{s.UID}</td>
                    <td>{s.department}</td>
                    <td>{s.section}</td>
                    <td>
                      <button 
                        className="delete-btn" 
                        onClick={() => deleteStudent(s.UID)}
                        title="Delete Student"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {activeTab === 'pc' && (
          <>
            <div className="action-section">
              <button className="add-btn secondary" onClick={() => setShowPCForm((v) => !v)}>
                <span className="btn-icon">+</span>
                {showPCForm ? 'Close Form' : 'Add Placement Coordinator'}
              </button>
            </div>

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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pcs.map((pc) => (
                  <tr key={pc.employeeId}>
                    <td>{pc.name}</td>
                    <td>{pc.employeeId}</td>
                    <td>{pc.department}</td>
                    <td>
                      <button 
                        className="delete-btn" 
                        onClick={() => deletePC(pc.employeeId)}
                        title="Delete Placement Coordinator"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {activeTab === 'tpo' && (
          <>
            <div className="action-section">
              <button className="add-btn success" onClick={() => setShowTPOForm((v) => !v)}>
                <span className="btn-icon">+</span>
                {showTPOForm ? 'Close Form' : 'Add Training & Placement Officer'}
              </button>
            </div>

            {showTPOForm && (
              <div className="reg-form-box animate-slide-in">
                <h3>Add New Training & Placement Officer</h3>
                <TrainingPlacementRegisterForm onSuccess={() => { setShowTPOForm(false); fetchTPOs(); }} />
              </div>
            )}
            
            <h3>Training & Placement Officers</h3>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tpos.map((tpo) => (
                  <tr key={tpo.employeeId || tpo.tpdId}>
                    <td>{tpo.name}</td>
                    <td>{tpo.employeeId || tpo.tpdId}</td>
                    <td>
                      <button 
                        className="delete-btn" 
                        onClick={() => deleteTPO(tpo.employeeId || tpo.tpdId)}
                        title="Delete Training & Placement Officer"
                      >
                        🗑️ Delete
                      </button>
                    </td>
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
