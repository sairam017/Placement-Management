import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Footer from './footer/Footer';

const StudentRegisterForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    UID: '',
    department: '',
    section: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uidError, setUidError] = useState('');
  const [isCheckingUID, setIsCheckingUID] = useState(false);

  // Debounced UID validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.UID.trim() && formData.UID.length > 2) {
        validateUID(formData.UID.trim());
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.UID]);

  const validateUID = async (uid) => {
    setIsCheckingUID(true);
    try {
      const uidExists = await checkUIDExists(uid);
      if (uidExists) {
        setUidError(`UID "${uid}" already exists. Please choose a different UID.`);
      } else {
        setUidError('');
      }
    } catch (error) {
      console.error('UID validation error:', error);
      // Don't show error for validation, just log it
    } finally {
      setIsCheckingUID(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear UID error when user starts typing
    if (name === 'UID') {
      setUidError('');
    }
  };

  const checkUIDExists = async (uid) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/students/uid/${uid}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      return response.data.data !== null;
    } catch (error) {
      if (error.response?.status === 404) {
        return false; // UID doesn't exist, which is good
      }
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Basic validation
      if (!formData.UID.trim()) {
        setUidError('UID is required');
        return;
      }
      
      if (uidError) {
        // Don't submit if there's already a UID error
        return;
      }
      
      // If password is empty, set a default password based on UID
      const submissionData = {
        ...formData,
        UID: formData.UID.trim(),
        name: formData.name.trim(),
        department: formData.department.trim(),
        section: formData.section.trim(),
        password: formData.password.trim() || `student_${formData.UID.trim()}`
      };
      
      const response = await axios.post('http://localhost:5000/api/students/create', submissionData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.data.success) {
        alert(`✅ Student registered successfully!\nUID: ${submissionData.UID}\nName: ${submissionData.name}`);
        setFormData({
          name: '',
          UID: '',
          department: '',
          section: '',
          password: ''
        });
        setUidError('');
        onSuccess();
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Server error';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Handle specific error cases
      if (errorMessage.includes('UID already taken') || errorMessage.includes('already exists')) {
        setUidError(errorMessage);
      } else if (errorMessage.includes('Access denied')) {
        alert('❌ Access denied. Please make sure you are logged in as an admin.');
      } else {
        alert('❌ Error registering student: ' + errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-light rounded-lg">
      <div className="mb-3">
        <label className="form-label">Full Name</label>
        <input
          type="text"
          className="form-control"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">UID</label>
        <div className="input-group">
          <input
            type="text"
            className={`form-control ${uidError ? 'is-invalid' : ''}`}
            name="UID"
            value={formData.UID}
            onChange={handleChange}
            required
          />
          {isCheckingUID && (
            <span className="input-group-text">
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            </span>
          )}
        </div>
        {uidError && (
          <div className="invalid-feedback d-block">
            {uidError}
          </div>
        )}
      </div>
      <div className="mb-3">
        <label className="form-label">Department</label>
        <input
          type="text"
          className="form-control"
          name="department"
          value={formData.department}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Section</label>
        <input
          type="text"
          className="form-control"
          name="section"
          value={formData.section}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Password</label>
        <input
          type="password"
          className="form-control"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Leave blank for default password"
        />
      </div>
      <button 
        type="submit" 
        className="btn btn-primary w-100" 
        disabled={isSubmitting || !!uidError}
      >
        {isSubmitting ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Registering...
          </>
        ) : (
          'Register Student'
        )}
      </button>
    </form>
  );
};

const PlacementCoordinatorForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    department: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/coordinators', formData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      alert('Placement Coordinator registered successfully!');
      setFormData({
        name: '',
        employeeId: '',
        department: '',
        email: '',
        password: ''
      });
      onSuccess();
    } catch (error) {
      console.error('Registration error:', error);
      alert('Error registering coordinator: ' + (error.response?.data?.message || 'Server error'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-light rounded-lg">
      <div className="mb-3">
        <label className="form-label">Full Name</label>
        <input
          type="text"
          className="form-control"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Employee ID</label>
        <input
          type="text"
          className="form-control"
          name="employeeId"
          value={formData.employeeId}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Department</label>
        <input
          type="text"
          className="form-control"
          name="department"
          value={formData.department}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Email</label>
        <input
          type="email"
          className="form-control"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Password</label>
        <input
          type="password"
          className="form-control"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </div>
      <button type="submit" className="btn btn-secondary w-100">
        Register Coordinator
      </button>
    </form>
  );
};

const TrainingPlacementRegisterForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/tpos', formData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      alert('TPO registered successfully!');
      setFormData({
        name: '',
        employeeId: '',
        email: '',
        password: ''
      });
      onSuccess();
    } catch (error) {
      console.error('Registration error:', error);
      alert('Error registering TPO: ' + (error.response?.data?.message || 'Server error'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-light rounded-lg">
      <div className="mb-3">
        <label className="form-label">Full Name</label>
        <input
          type="text"
          className="form-control"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Employee ID</label>
        <input
          type="text"
          className="form-control"
          name="employeeId"
          value={formData.employeeId}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Email</label>
        <input
          type="email"
          className="form-control"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Password</label>
        <input
          type="password"
          className="form-control"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </div>
      <button type="submit" className="btn btn-success w-100">
        Register TPO
      </button>
    </form>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [pcs, setPCs] = useState([]);
  const [tpos, setTPOs] = useState([]);
  const [adminData, setAdminData] = useState(null);
  const [activeTab, setActiveTab] = useState('student');
  const [studentFilter, setStudentFilter] = useState('all');
  const [uidSearch, setUidSearch] = useState('');
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showPCForm, setShowPCForm] = useState(false);
  const [showTPOForm, setShowTPOForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSuccess = (formType) => {
    switch (formType) {
      case 'student':
        setShowStudentForm(false);
        fetchStudents();
        break;
      case 'pc':
        setShowPCForm(false);
        fetchPCs();
        break;
      case 'tpo':
        setShowTPOForm(false);
        fetchTPOs();
        break;
      default:
        break;
    }
  };

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

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/');
  };

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/students/all', {
        headers: getAuthHeaders()
      });
      const studentsData = res.data.data || [];
      const normalizedStudents = studentsData.map(student => ({
        ...student,
        name: student.name?.trim() || 'UNKNOWN_NAME',
        UID: student.UID?.trim() || 'UNKNOWN_UID',
        department: student.department ? student.department.trim().toUpperCase() : 'UNKNOWN',
        section: student.section?.trim() || 'UNKNOWN_SECTION',
      }));
      setStudents(normalizedStudents);
      setFilteredStudents(normalizedStudents);
      setStudentFilter('all');
      setUidSearch('');
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Error fetching students: ' + (error.response?.data?.message || 'Server error'));
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPCs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/coordinators/coordinators', {
        headers: getAuthHeaders()
      });
      setPCs(res.data.data || []);
    } catch (error) {
      console.error('Error fetching coordinators:', error);
      alert('Error fetching coordinators: ' + (error.response?.data?.message || 'Server error'));
      setPCs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTPOs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/tpos', {
        headers: getAuthHeaders()
      });
      setTPOs(res.data.data || []);
    } catch (error) {
      console.error('Error fetching TPOs:', error);
      alert('Error fetching TPOs: ' + (error.response?.data?.message || 'Server error'));
      setTPOs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterStudents = useCallback(() => {
    if (!Array.isArray(students) || students.length === 0) {
      setFilteredStudents([]);
      return;
    }
    let filtered = [...students];
    if (studentFilter && studentFilter !== 'all') {
      filtered = filtered.filter(student => student.department === studentFilter);
    }
    if (uidSearch && uidSearch.trim()) {
      filtered = filtered.filter(student =>
        student.UID?.toLowerCase().includes(uidSearch.trim().toLowerCase())
      );
    }
    setFilteredStudents(filtered);
  }, [students, studentFilter, uidSearch]);

  const getUniqueDepartments = useCallback(() => {
    if (!Array.isArray(students)) return [];
    return [...new Set(students.map(s => s.department).filter(d => d && d !== 'UNKNOWN'))].sort();
  }, [students]);

  useEffect(() => {
    if (activeTab === 'student') {
      fetchStudents();
    } else if (activeTab === 'pc') {
      fetchPCs();
    } else if (activeTab === 'tpo') {
      fetchTPOs();
    }
  }, [activeTab, fetchStudents, fetchPCs, fetchTPOs]);

  useEffect(() => {
    filterStudents();
  }, [students, studentFilter, uidSearch, filterStudents]);

  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['csv', 'xlsx', 'xls'];
    if (!allowedExtensions.includes(fileExtension)) {
      alert('Please upload a valid CSV or Excel file (.csv, .xlsx, .xls)');
      e.target.value = '';
      return;
    }
    
    if (fileExtension !== 'csv') {
      alert('Currently only CSV files are supported. Please convert your Excel file to CSV format.');
      e.target.value = '';
      return;
    }

    setIsLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value) => value?.trim(),
      complete: async (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            alert('The uploaded file appears to be empty or has no valid data.');
            return;
          }
          
          const requiredFields = ['Full Name', 'UID', 'Department', 'Section'];
          const csvHeaders = Object.keys(results.data[0] || {});
          const missingFields = requiredFields.filter(field => !csvHeaders.includes(field));
          
          if (missingFields.length > 0) {
            alert(`Missing required columns: ${missingFields.join(', ')}\n\nRequired columns are:\n- Full Name\n- UID\n- Department\n- Section\n- Password (optional)\n\nFound columns: ${csvHeaders.join(', ')}`);
            return;
          }
          
          const validData = results.data.filter((row) => {
            return (
              row['Full Name']?.trim() &&
              row['UID']?.trim() &&
              row['Department']?.trim() &&
              row['Section']?.trim()
            );
          });
          
          if (validData.length === 0) {
            alert('No valid student records found in the file. Please check that all required fields are filled.');
            return;
          }
          
          const formattedData = validData.map(row => ({
            name: row['Full Name'].trim(),
            UID: row['UID'].trim(),
            department: row['Department'].trim().toUpperCase(),
            section: row['Section'].trim(),
            password: row['Password'] ? row['Password'].trim() : `student_${row['UID'].trim()}`,
          }));
          
          const confirmMessage = `Found ${formattedData.length} valid student records.\n\nProceed with bulk upload?`;
          if (!window.confirm(confirmMessage)) {
            return;
          }
          
          const res = await axios.post(
            'http://localhost:5000/api/students/bulk', 
            formattedData,
            { headers: getAuthHeaders() }
          );
          
          alert(`✅ Success! ${res.data.message}\n${res.data.insertedCount} students added successfully.`);
          setStudentFilter('all');
          setUidSearch('');
          fetchStudents();
        } catch (error) {
          console.error('Bulk upload error:', error);
          let errorMessage = 'Unknown error occurred';
          let detailedInfo = '';
          
          if (error.response) {
            errorMessage = error.response.data?.message || `Server error (${error.response.status})`;
            if (error.response.data?.errors) {
              detailedInfo = '\n\nValidation Errors:\n' + error.response.data.errors.join('\n');
            }
            if (error.response.data?.processedCount !== undefined) {
              detailedInfo += `\n\nProcessed: ${error.response.data.processedCount}/${error.response.data.totalCount} records`;
            }
          } else if (error.request) {
            errorMessage = 'No response from server. Please check if the server is running.';
          } else {
            errorMessage = error.message;
          }
          
          alert('❌ Error uploading bulk data: ' + errorMessage + detailedInfo);
        } finally {
          setIsLoading(false);
          e.target.value = '';
        }
      },
      error: (error) => {
        console.error('CSV parse error:', error);
        alert('❌ Error reading CSV file. Please check if the file is properly formatted.');
        setIsLoading(false);
        e.target.value = '';
      },
    });
  };

  const deleteStudent = async (uid) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/students/${uid}`, {
        headers: getAuthHeaders()
      });
      alert('Student deleted successfully');
      fetchStudents();
    } catch (error) {
      console.error('Delete student error:', error);
      alert('Error deleting student: ' + (error.response?.data?.message || 'Server error'));
    }
  };

  const deletePC = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this Placement Coordinator?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/coordinators/${employeeId}`, {
        headers: getAuthHeaders()
      });
      alert('Placement Coordinator deleted successfully');
      fetchPCs();
    } catch (error) {
      console.error('Delete PC error:', error);
      alert('Error deleting Placement Coordinator: ' + (error.response?.data?.message || 'Server error'));
    }
  };

  const deleteTPO = async (tpoId) => {
    if (!window.confirm('Are you sure you want to delete this Training & Placement Officer?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/tpos/${tpoId}`, {
        headers: getAuthHeaders()
      });
      alert('Training & Placement Officer deleted successfully');
      fetchTPOs();
    } catch (error) {
      console.error('Delete TPO error:', error);
      alert('Error deleting TPO: ' + (error.response?.data?.message || 'Server error'));
    }
  };

  return (
    <div className="admin-bg">
      <div className="admin-dashboard-container animate-fade-in">
        {/* Logout Button in Top-Right Corner */}
        <div className="logout-container">
          <button onClick={handleLogout} className="logout-btn">
            <i className="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>

        <div className="admin-header-fixed">
          <div className="dashboard-title-section">
            <h1 className="dashboard-main-title slide-in-left">
              System Administrator
            </h1>
            <h2 className="dashboard-subtitle slide-in-right">
              Admin Dashboard
            </h2>
          </div>
          
          {adminData && (
            <div className="admin-header">
              <div>
                <h4 style={{ margin: 0, color: '#28a745', fontSize: '14px' }}>
                  Welcome, {adminData.name}
                </h4>
                <small style={{ color: '#6c757d', fontSize: '11px' }}>
                  UID: {adminData.uid} | Role: {adminData.role}
                </small>
              </div>
            </div>
          )}

          <div className="dashboard-tab-group justify-content-center">
            <button
              className={`dashboard-tab ${activeTab === 'student' ? 'active' : ''} tab-animate`}
              onClick={() => setActiveTab('student')}
            >
              Students
            </button>
            <button
              className={`dashboard-tab ${activeTab === 'pc' ? 'active' : ''} tab-animate`}
              onClick={() => setActiveTab('pc')}
            >
              Placement Coordinators
            </button>
            <button
              className={`dashboard-tab ${activeTab === 'tpo' ? 'active' : ''} tab-animate`}
              onClick={() => setActiveTab('tpo')}
            >
              Training & Placement Officers
            </button>
          </div>
        </div>

        <div className="dashboard-content">
          {isLoading && (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading data...</p>
            </div>
          )}

          {!isLoading && activeTab === 'student' && (
            <div className="enhanced-tab-content">
              <div className="enhanced-action-section">
                <div className="d-flex align-items-center gap-3 flex-wrap justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <button
                      className={`add-btn primary form-collapse-btn ${showStudentForm ? 'form-open' : ''}`}
                      onClick={() => setShowStudentForm(v => !v)}
                      data-form-status={showStudentForm ? 'open' : 'closed'}
                      disabled={isLoading}
                    >
                      <span className="btn-icon">{showStudentForm ? '−' : '+'}</span>
                      {showStudentForm ? 'Close Form' : 'Add Student'}
                    </button>
                    {showStudentForm && (
                      <div className="bulk-upload-container">
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleBulkUpload}
                          style={{ display: 'none' }}
                          id="bulk-upload-input"
                          disabled={isLoading}
                        />
                        <label
                          htmlFor="bulk-upload-input"
                          className="upload-btn btn btn-outline-primary"
                        >
                          📁 Upload Bulk Data
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <div className="filter-group">
                      <label htmlFor="department-filter" className="filter-label">
                        Department:
                      </label>
                      <select
                        id="department-filter"
                        className="filter-select form-select form-select-sm"
                        value={studentFilter}
                        onChange={e => setStudentFilter(e.target.value)}
                        disabled={isLoading}
                      >
                        <option value="all">All Departments</option>
                        {getUniqueDepartments().map(dept => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-group" style={{ minWidth: '180px' }}>
                      <label htmlFor="uid-search" className="filter-label">
                        Search UID:
                      </label>
                      <div className="d-flex align-items-center">
                        <input
                          type="text"
                          id="uid-search"
                          className="filter-input form-control form-control-sm"
                          placeholder="Enter UID..."
                          value={uidSearch}
                          onChange={e => setUidSearch(e.target.value)}
                          style={{ width: '140px', marginRight: '4px' }}
                          disabled={isLoading}
                        />
                        {uidSearch && (
                          <button
                            onClick={() => setUidSearch('')}
                            className="clear-search-btn btn btn-sm btn-outline-secondary"
                            title="Clear search"
                            disabled={isLoading}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {filteredStudents.length === 0 && students.length > 0 && (
                  <div className="alert alert-warning mt-3 mb-0 py-2">
                    <strong>No students found</strong> matching your criteria.
                    {uidSearch && <span> Try a different UID.</span>}
                  </div>
                )}
              </div>

              {showStudentForm && (
                <div className="reg-form-box enhanced animate-slide-in mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="text-primary m-0 fs-6 fw-semibold">
                      📝 Add New Student
                    </h3>
                    <button
                      onClick={() => setShowStudentForm(false)}
                      className="btn-close"
                      title="Close Form"
                      disabled={isLoading}
                    />
                  </div>
                  <StudentRegisterForm onSuccess={() => handleFormSuccess('student')} />
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="fs-5 m-0 fw-semibold text-dark">
                  📊 Student List
                </h3>
                <div className="student-count small">
                  <span className="count-badge badge bg-light text-dark">
                    {filteredStudents.length} of {students.length} students
                  </span>
                </div>
              </div>

              <div className="enhanced-table-container table-section">
                <div className="table-responsive">
                  {filteredStudents.length === 0 && students.length === 0 ? (
                    <div className="alert alert-info text-center py-4">
                      <div className="fs-1 mb-3">🔍</div>
                      <h4 className="mb-2">No students available</h4>
                      <p className="m-0">Add your first student to get started</p>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="alert alert-info text-center py-4">
                      <div className="fs-1 mb-3">🔍</div>
                      <h4 className="mb-2">No matching students found</h4>
                      <p className="m-0">
                        {uidSearch ? `No results for "${uidSearch}"` : 'Try adjusting your filters'}
                      </p>
                    </div>
                  ) : (
                    <table className="table table-striped table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th>UID</th>
                          <th>Department</th>
                          <th>Section</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student) => (
                          <tr key={student.UID}>
                            <td className="fw-medium">{student.name}</td>
                            <td className="font-monospace text-primary">{student.UID}</td>
                            <td>{student.department}</td>
                            <td>{student.section}</td>
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => deleteStudent(student.UID)}
                                title="Delete Student"
                                disabled={isLoading}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {!isLoading && activeTab === 'pc' && (
            <div className="enhanced-tab-content">
              <div className="enhanced-action-section">
                <button
                  className={`add-btn secondary form-collapse-btn ${showPCForm ? 'form-open' : ''}`}
                  onClick={() => setShowPCForm(v => !v)}
                  data-form-status={showPCForm ? 'open' : 'closed'}
                  disabled={isLoading}
                >
                  <span className="btn-icon">{showPCForm ? '−' : '+'}</span>
                  {showPCForm ? 'Close Form' : 'Add Placement Coordinator'}
                </button>
              </div>
              
              {showPCForm && (
                <div className="reg-form-box enhanced animate-slide-in mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="text-secondary m-0 fs-6 fw-semibold">
                      👥 Add New Placement Coordinator
                    </h3>
                    <button
                      onClick={() => setShowPCForm(false)}
                      className="btn-close"
                      title="Close Form"
                      disabled={isLoading}
                    />
                  </div>
                  <PlacementCoordinatorForm onSuccess={() => handleFormSuccess('pc')} />
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="fs-5 m-0 fw-semibold text-dark">
                  👥 Placement Coordinators
                </h3>
                <div className="student-count small">
                  <span className="count-badge badge bg-light text-dark">
                    {pcs.length} coordinators
                  </span>
                </div>
              </div>

              <div className="enhanced-table-container">
                {pcs.length === 0 ? (
                  <div className="alert alert-info text-center py-4">
                    <div className="fs-1 mb-3">👥</div>
                    <h4 className="mb-2">No coordinators found</h4>
                    <p className="m-0">Add your first placement coordinator to get started</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th>Employee ID</th>
                          <th>Department</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pcs.map((pc) => (
                          <tr key={pc.employeeId}>
                            <td className="fw-medium">{pc.name}</td>
                            <td className="font-monospace text-info">{pc.employeeId}</td>
                            <td>{pc.department}</td>
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => deletePC(pc.employeeId)}
                                title="Delete Placement Coordinator"
                                disabled={isLoading}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isLoading && activeTab === 'tpo' && (
            <div className="enhanced-tab-content">
              <div className="enhanced-action-section">
                <button
                  className={`add-btn success form-collapse-btn ${showTPOForm ? 'form-open' : ''}`}
                  onClick={() => setShowTPOForm(v => !v)}
                  data-form-status={showTPOForm ? 'open' : 'closed'}
                  disabled={isLoading}
                >
                  <span className="btn-icon">{showTPOForm ? '−' : '+'}</span>
                  {showTPOForm ? 'Close Form' : 'Add Training & Placement Officer'}
                </button>
              </div>
              
              {showTPOForm && (
                <div className="reg-form-box enhanced animate-slide-in mb-4">
                  <h3 className="text-success mb-3 fs-6 fw-semibold">
                    🎯 Add New Training & Placement Officer
                  </h3>
                  <TrainingPlacementRegisterForm onSuccess={() => handleFormSuccess('tpo')} />
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="fs-5 m-0 fw-semibold text-dark">
                  🎯 Training & Placement Officers
                </h3>
                <div className="student-count small">
                  <span className="count-badge badge bg-light text-dark">
                    {tpos.length} officers
                  </span>
                </div>
              </div>

              <div className="enhanced-table-container">
                {tpos.length === 0 ? (
                  <div className="alert alert-info text-center py-4">
                    <div className="fs-1 mb-3">🎯</div>
                    <h4 className="mb-2">No TPO officers found</h4>
                    <p className="m-0">Add your first Training & Placement Officer to get started</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th>Employee ID</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tpos.map((tpo) => (
                          <tr key={tpo.employeeId || tpo.tpdId}>
                            <td className="fw-medium">{tpo.name}</td>
                            <td className="font-monospace text-success">
                              {tpo.employeeId || tpo.tpdId}
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => deleteTPO(tpo.employeeId || tpo.tpdId)}
                                title="Delete Training & Placement Officer"
                                disabled={isLoading}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default AdminDashboard;