import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Papa from 'papaparse'; // Import papaparse
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
  const [uidSearch, setUidSearch] = useState('');
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showPCForm, setShowPCForm] = useState(false);
  const [showTPOForm, setShowTPOForm] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [tableHeight, setTableHeight] = useState('calc(100vh - 300px)');

  // Auto-close form after successful submission
  const handleFormSuccess = (formType) => {
    switch(formType) {
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

  // Dynamic table height calculation based on form visibility
  useEffect(() => {
    const calculateTableHeight = () => {
      const baseHeight = window.innerHeight;
      let headerHeight = 250; // Header + nav + margins
      let formHeight = 0;
      let actionHeight = 100; // Action buttons + padding
      let padding = 50; // Extra safety padding
      
      // Adjust form height based on what's visible
      if (activeTab === 'student' && showStudentForm) {
        formHeight = 280;
      } else if (activeTab === 'pc' && showPCForm) {
        formHeight = 280;
      } else if (activeTab === 'tpo' && showTPOForm) {
        formHeight = 280;
      }
      
      // Calculate available height
      const availableHeight = baseHeight - headerHeight - formHeight - actionHeight - padding;
      const finalHeight = Math.max(350, Math.min(availableHeight, baseHeight * 0.6));
      
      setTableHeight(`${finalHeight}px`);
    };

    calculateTableHeight();
    window.addEventListener('resize', calculateTableHeight);
    
    return () => window.removeEventListener('resize', calculateTableHeight);
  }, [showStudentForm, showPCForm, showTPOForm, activeTab]);

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

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/');
  };

  const fetchStudents = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/students/all');
      setStudents(res.data.data || []);
    } catch {
      setStudents([]);
    }
  }, []);

  const fetchPCs = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/coordinators/coordinators');
      setPCs(res.data.data || []);
    } catch {
      setPCs([]);
    }
  }, []);

  const fetchTPOs = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tpos');
      setTPOs(res.data.data || []);
    } catch {
      setTPOs([]);
    }
  }, []);

  const filterStudents = useCallback(() => {
    let filtered = students;
    
    // Filter by department
    if (studentFilter !== 'all') {
      filtered = filtered.filter(student =>
        student.department?.toLowerCase() === studentFilter.toLowerCase()
      );
    }
    
    // Filter by UID search
    if (uidSearch.trim()) {
      filtered = filtered.filter(student =>
        student.UID?.toLowerCase().includes(uidSearch.trim().toLowerCase())
      );
    }
    
    setFilteredStudents(filtered);
  }, [students, studentFilter, uidSearch]);

  const getUniqueDepartments = () => {
    const departments = [...new Set(students.map(s => s.department).filter(d => d))];
    return departments.sort();
  };

  useEffect(() => {
    if (activeTab === 'student') fetchStudents();
    else if (activeTab === 'pc') fetchPCs();
    else if (activeTab === 'tpo') fetchTPOs();
  }, [activeTab, fetchStudents, fetchPCs, fetchTPOs]);

  useEffect(() => {
    filterStudents();
  }, [filterStudents]);

  const deleteStudent = async (uid) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
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
    }
  };

  const deletePC = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this Placement Coordinator?')) {
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
    }
  };

  const deleteTPO = async (tpoId) => {
    if (window.confirm('Are you sure you want to delete this Training & Placement Officer?')) {
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
    }
  };

  // Handle Bulk Upload
  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['csv', 'xlsx', 'xls'];
    
    if (!allowedExtensions.includes(fileExtension)) {
      alert('Please upload a valid CSV or Excel file (.csv, .xlsx, .xls)');
      e.target.value = ''; // Reset file input
      return;
    }

    // For now, only handle CSV files (Excel support would require additional library)
    if (fileExtension !== 'csv') {
      alert('Currently only CSV files are supported. Please convert your Excel file to CSV format.');
      e.target.value = ''; // Reset file input
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(), // Remove extra spaces from headers
      complete: async (results) => {
        try {
          // Check if file has data
          if (!results.data || results.data.length === 0) {
            alert('The uploaded file appears to be empty or has no valid data.');
            return;
          }

          const requiredFields = ['Full Name', 'UID', 'Department', 'Section'];
          const csvHeaders = Object.keys(results.data[0] || {});

          const missingFields = requiredFields.filter(field => !csvHeaders.includes(field));
          if (missingFields.length > 0) {
            alert(`Missing required columns: ${missingFields.join(', ')}\n\nRequired columns are:\n- Full Name\n- UID\n- Department\n- Section\n- Password (optional)`);
            return;
          }

          // Filter out empty rows and validate data
          const validData = results.data.filter(row => 
            row['Full Name'] && row['Full Name'].trim() &&
            row['UID'] && row['UID'].trim() &&
            row['Department'] && row['Department'].trim() &&
            row['Section'] && row['Section'].trim()
          );

          if (validData.length === 0) {
            alert('No valid student records found in the file. Please check that all required fields are filled.');
            return;
          }

          const formattedData = validData.map(row => ({
            name: row['Full Name'].trim(),
            UID: row['UID'].trim(),
            department: row['Department'].trim(),
            section: row['Section'].trim(),
            password: row['Password'] ? row['Password'].trim() : `student_${row['UID'].trim()}`
          }));

          // Show confirmation before uploading
          const confirmMessage = `Found ${formattedData.length} valid student records.\n\nProceed with bulk upload?`;
          if (!window.confirm(confirmMessage)) {
            return;
          }

          const res = await axios.post('http://localhost:5000/api/students/bulk', formattedData, {
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders()
            }
          });

          alert(`✅ Success! ${res.data.message}\n${res.data.insertedCount} students added successfully.`);
          fetchStudents(); // Refresh student list
          
          // Reset file input
          e.target.value = '';
          
        } catch (error) {
          console.error('Bulk upload error:', error);
          let errorMessage = 'Unknown error occurred';
          
          if (error.response) {
            // Server responded with error status
            errorMessage = error.response.data?.message || `Server error (${error.response.status})`;
          } else if (error.request) {
            // Request was made but no response received
            errorMessage = 'No response from server. Please check if the server is running.';
          } else {
            // Something else happened
            errorMessage = error.message;
          }
          
          alert('❌ Error uploading bulk data: ' + errorMessage);
          e.target.value = ''; // Reset file input
        }
      },
      error: (error) => {
        console.error('CSV parse error:', error);
        alert('❌ Error reading CSV file. Please check if the file is properly formatted.');
        e.target.value = ''; // Reset file input
      }
    });
  };

  return (
    <div className="admin-bg" style={{
      margin: 0,
      padding: 0,
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      backgroundColor: '#f8f9fa'
    }}>
      <div className="admin-dashboard-container animate-fade-in" style={{
        height: '100%',
        width: '100%',
        margin: 0,
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {/* Fixed Admin Header */}
        <div className="admin-header-fixed" style={{
          flexShrink: 0,
          zIndex: 100,
          backgroundColor: 'white',
          borderBottom: '2px solid #dee2e6',
          paddingBottom: '8px',
          marginBottom: '0'
        }}>
          {adminData && (
            <div className="admin-header" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '12px', 
              padding: '10px 15px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '6px',
              border: '1px solid #dee2e6'
            }}>
              <div>
                <h4 style={{ margin: 0, color: '#28a745', fontSize: '18px' }}>
                  Welcome, {adminData.name}
                </h4>
                <small style={{ color: '#6c757d', fontSize: '12px' }}>
                  UID: {adminData.uid} | Role: {adminData.role}
                </small>
              </div>
              <button 
                onClick={handleLogout}
                className="btn btn-outline-danger btn-sm"
                style={{ minWidth: '70px', padding: '4px 8px', fontSize: '12px' }}
              >
                Logout
              </button>
            </div>
          )}
          
          <div className="dashboard-title-section" style={{ textAlign: 'center', marginBottom: '15px' }}>
            <h1 className="dashboard-main-title" style={{ 
              fontSize: '24px', 
              fontWeight: '800', 
              color: '#2d3748', 
              margin: '0 0 5px 0',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              System Administrator
            </h1>
            <h2 className="dashboard-subtitle" style={{ 
              fontSize: '16px', 
              color: '#667eea', 
              margin: '0 0 5px 0',
              fontWeight: '600'
            }}>
              Admin Dashboard
            </h2>
          </div>
          <div className="dashboard-tab-group" style={{ marginBottom: '8px' }}>
            <button
              className={`dashboard-tab ${activeTab === 'student' ? 'active' : ''}`}
              onClick={() => setActiveTab('student')}
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              Students
            </button>
            <button
              className={`dashboard-tab ${activeTab === 'pc' ? 'active' : ''}`}
              onClick={() => setActiveTab('pc')}
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              Placement Coordinators
            </button>
            <button
              className={`dashboard-tab ${activeTab === 'tpo' ? 'active' : ''}`}
              onClick={() => setActiveTab('tpo')}
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              Training & Placement Officers
            </button>
          </div>
        </div>

        {/* Content Area with controlled height */}
        <div className="dashboard-content" style={{
          flex: 1,
          overflowY: 'auto',
          paddingTop: '10px',
          minHeight: 0
        }}>
          <hr style={{ margin: '0 0 10px 0' }} />
        {activeTab === 'student' && (
          <div className="enhanced-tab-content" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: 'calc(100vh - 200px)',
            gap: '10px',
            overflow: 'hidden'
          }}>
            {/* Action Section - Always visible at top */}
            <div className="enhanced-action-section" style={{
              position: 'sticky',
              top: '0',
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(15px)',
              zIndex: 50,
              padding: '10px 15px',
              borderBottom: '1px solid #e2e8f0',
              marginBottom: '0',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              flexShrink: 0,
              order: 0
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                marginBottom: '8px',
                flexWrap: 'wrap'
              }}>
                <button 
                  className={`add-btn primary form-collapse-btn ${showStudentForm ? 'form-open' : ''}`} 
                  onClick={() => setShowStudentForm((v) => !v)} 
                  style={{ padding: '6px 12px', fontSize: '13px', position: 'relative' }}
                  data-form-status={showStudentForm ? 'open' : 'closed'}
                >
                  <span className="btn-icon">{showStudentForm ? '−' : '+'}</span>
                  {showStudentForm ? 'Close Form' : 'Add Student'}
                </button>

                {/* Show Bulk Upload Button Only When Form is Open */}
                {showStudentForm && (
                  <div className="bulk-upload-container">
                    <input 
                      type="file" 
                      accept=".csv,.xlsx,.xls"
                      onChange={handleBulkUpload} 
                      style={{ display: 'none' }}
                      id="bulk-upload-input"
                    />
                    <button 
                      className="upload-btn"
                      onClick={() => document.getElementById('bulk-upload-input').click()}
                      type="button"
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                    >
                      📁 Upload Bulk Data
                    </button>
                  </div>
                )}
              </div>

              <div className="filter-section" style={{ width: '100%' }}>
                <div className="filter-row" style={{
                  display: 'flex',
                  gap: '15px',
                  alignItems: 'center',
                  marginBottom: '8px',
                  flexWrap: 'wrap'
                }}>
                  <div className="filter-group" style={{ minWidth: '180px' }}>
                    <label htmlFor="department-filter" className="filter-label" style={{ fontSize: '12px', marginBottom: '4px' }}>Department:</label>
                    <select 
                      id="department-filter"
                      className="filter-select"
                      value={studentFilter} 
                      onChange={(e) => setStudentFilter(e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '13px' }}
                    >
                      <option value="all">All Departments</option>
                      {getUniqueDepartments().map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="filter-group" style={{ minWidth: '220px' }}>
                    <label htmlFor="uid-search" className="filter-label" style={{ fontSize: '12px', marginBottom: '4px' }}>Search UID:</label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="text"
                        id="uid-search"
                        className="filter-input"
                        placeholder="Enter UID..."
                        value={uidSearch}
                        onChange={(e) => setUidSearch(e.target.value)}
                        style={{
                          padding: '4px 8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '13px',
                          minWidth: '150px',
                          marginRight: '6px'
                        }}
                      />
                      {uidSearch && (
                        <button
                          onClick={() => setUidSearch('')}
                          className="clear-search-btn"
                          title="Clear search"
                          style={{
                            padding: '4px 8px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="student-count" style={{ marginLeft: 'auto' }}>
                    <span className="count-badge" style={{ fontSize: '12px' }}>
                      {filteredStudents.length} of {students.length} students
                      {uidSearch && ` (searching: "${uidSearch}")`}
                      {studentFilter !== 'all' && ` (${studentFilter})`}
                    </span>
                  </div>
                </div>
                
                {filteredStudents.length === 0 && (students.length > 0) && (
                  <div style={{ 
                    marginTop: '5px', 
                    padding: '6px 10px', 
                    backgroundColor: '#fff3cd', 
                    border: '1px solid #ffeaa7', 
                    borderRadius: '4px',
                    color: '#856404',
                    fontSize: '12px'
                  }}>
                    <strong>No students found</strong> matching your criteria.
                    {uidSearch && <span> Try a different UID.</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Form Section - Appears above table when open */}
            {showStudentForm && (
              <div className="reg-form-box enhanced animate-slide-in" style={{
                marginBottom: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '2px solid #007bff',
                borderRadius: '12px',
                padding: '15px',
                boxShadow: '0 4px 15px rgba(0, 123, 255, 0.15)',
                maxHeight: '260px',
                overflowY: 'auto',
                flexShrink: 0,
                order: 1,
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ color: '#007bff', margin: '0', fontSize: '15px', fontWeight: '600' }}>
                    📝 Add New Student
                  </h3>
                  <button
                    onClick={() => setShowStudentForm(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '20px',
                      color: '#6c757d',
                      cursor: 'pointer',
                      padding: '0',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Close Form"
                  >
                    ×
                  </button>
                </div>
                <StudentRegisterForm onSuccess={() => handleFormSuccess('student')} />
              </div>
            )}

            {/* Table Section - Maximum space utilization */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', order: 2 }}>
              <h3 style={{ fontSize: '16px', margin: '0', fontWeight: '600', color: '#2d3748' }}>
                📊 Student List
              </h3>
              <div className="student-count" style={{ fontSize: '12px' }}>
                <span className="count-badge" style={{ 
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontWeight: '600'
                }}>
                  {filteredStudents.length} of {students.length} students
                </span>
              </div>
            </div>
            
            <div className="enhanced-table-container table-section" style={{ 
              flex: 1,
              minHeight: '400px',
              height: tableHeight,
              maxHeight: tableHeight,
              overflowY: 'auto',
              overflowX: 'auto',
              border: '1px solid #dee2e6',
              borderRadius: '12px',
              backgroundColor: 'white',
              position: 'relative',
              order: 3,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {filteredStudents.length === 0 && students.length === 0 ? (
                <div className="table-loading">
                  Loading students...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div style={{ 
                  padding: '40px 20px', 
                  textAlign: 'center',
                  color: '#6b7280',
                  background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
                  borderRadius: '12px',
                  margin: '20px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔍</div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>No students found</h4>
                  <p style={{ margin: '0', fontSize: '14px' }}>
                    {uidSearch ? `No results for "${uidSearch}"` : 'Try adjusting your filters'}
                  </p>
                </div>
              ) : (
                <div style={{ 
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'auto',
                  height: '100%'
                }}>
                  <table className="dashboard-table" style={{ 
                    marginBottom: 0, 
                    fontSize: '13px', 
                    width: '100%',
                    tableLayout: 'auto'
                  }}>
                    <thead style={{
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#f8f9fa',
                      zIndex: 10
                    }}>
                      <tr>
                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#374151' }}>👤 Name</th>
                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#374151' }}>🆔 UID</th>
                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#374151' }}>🏢 Department</th>
                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#374151' }}>📚 Section</th>
                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#374151', textAlign: 'center' }}>⚡ Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s, index) => (
                        <tr key={s.UID} style={{
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                        }}>
                          <td style={{ padding: '10px 16px', fontWeight: '500' }}>{s.name}</td>
                          <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#6366f1' }}>{s.UID}</td>
                          <td style={{ padding: '10px 16px' }}>{s.department}</td>
                          <td style={{ padding: '10px 16px' }}>{s.section}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                            <button 
                              className="delete-btn" 
                              onClick={() => deleteStudent(s.UID)}
                              title="Delete Student"
                              style={{ 
                                padding: '6px 12px', 
                                fontSize: '11px',
                                borderRadius: '8px',
                                fontWeight: '600'
                              }}
                            >
                              🗑️ Delete
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
        {activeTab === 'pc' && (
          <div className="enhanced-tab-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="enhanced-action-section" style={{
              position: 'sticky',
              top: '0',
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(15px)',
              zIndex: 50,
              paddingTop: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid #e2e8f0',
              marginBottom: '15px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              flexShrink: 0
            }}>
              <button 
                className={`add-btn secondary form-collapse-btn ${showPCForm ? 'form-open' : ''}`} 
                onClick={() => setShowPCForm((v) => !v)} 
                style={{ padding: '6px 12px', fontSize: '13px', position: 'relative' }}
                data-form-status={showPCForm ? 'open' : 'closed'}
              >
                <span className="btn-icon">{showPCForm ? '−' : '+'}</span>
                {showPCForm ? 'Close Form' : 'Add Placement Coordinator'}
              </button>
            </div>
            {showPCForm && (
              <div className="reg-form-box enhanced animate-slide-in" style={{
                marginBottom: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '2px solid #6c757d',
                borderRadius: '12px',
                padding: '15px',
                boxShadow: '0 4px 15px rgba(108, 117, 125, 0.15)',
                maxHeight: '260px',
                overflowY: 'auto',
                flexShrink: 0,
                order: 1
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ color: '#6c757d', margin: '0', fontSize: '15px', fontWeight: '600' }}>
                    👥 Add New Placement Coordinator
                  </h3>
                  <button
                    onClick={() => setShowPCForm(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '20px',
                      color: '#6c757d',
                      cursor: 'pointer',
                      padding: '0',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Close Form"
                  >
                    ×
                  </button>
                </div>
                <PlacementCoordinatorForm onSuccess={() => handleFormSuccess('pc')} />
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', margin: '0', fontWeight: '600', color: '#2d3748' }}>
                👥 Placement Coordinators
              </h3>
              <div className="student-count" style={{ fontSize: '12px' }}>
                <span className="count-badge" style={{ 
                  background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontWeight: '600'
                }}>
                  {pcs.length} coordinators
                </span>
              </div>
            </div>
            
            <div className="enhanced-table-container" style={{ 
              flex: 1,
              minHeight: '300px',
              maxHeight: 'calc(100vh - 450px)',
              overflowY: 'auto',
              border: '1px solid #dee2e6',
              borderRadius: '12px',
              backgroundColor: 'white',
              position: 'relative'
            }}>
              {pcs.length === 0 ? (
                <div style={{ 
                  padding: '40px 20px', 
                  textAlign: 'center',
                  color: '#6b7280',
                  background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
                  borderRadius: '12px',
                  margin: '20px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>👥</div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>No coordinators found</h4>
                  <p style={{ margin: '0', fontSize: '14px' }}>
                    Add your first placement coordinator to get started
                  </p>
                </div>
              ) : (
                <table className="dashboard-table" style={{ marginBottom: 0, fontSize: '13px', width: '100%' }}>
                  <thead style={{
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#f8f9fa',
                    zIndex: 10
                  }}>
                    <tr>
                      <th style={{ padding: '12px 16px', fontWeight: '700', color: '#374151' }}>👤 Name</th>
                      <th style={{ padding: '12px 16px', fontWeight: '700', color: '#374151' }}>🆔 Employee ID</th>
                      <th style={{ padding: '12px 16px', fontWeight: '700', color: '#374151' }}>🏢 Department</th>
                      <th style={{ padding: '12px 16px', fontWeight: '700', color: '#374151', textAlign: 'center' }}>⚡ Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pcs.map((pc, index) => (
                      <tr key={pc.employeeId} style={{
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                      }}>
                        <td style={{ padding: '10px 16px', fontWeight: '500' }}>{pc.name}</td>
                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#0891b2' }}>{pc.employeeId}</td>
                        <td style={{ padding: '10px 16px' }}>{pc.department}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <button 
                            className="delete-btn" 
                            onClick={() => deletePC(pc.employeeId)}
                            title="Delete Placement Coordinator"
                            style={{ 
                              padding: '6px 12px', 
                              fontSize: '11px',
                              borderRadius: '8px',
                              fontWeight: '600'
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
        {activeTab === 'tpo' && (
          <div className="enhanced-tab-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="enhanced-action-section" style={{
              position: 'sticky',
              top: '0',
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(15px)',
              zIndex: 50,
              paddingTop: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid #e2e8f0',
              marginBottom: '15px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              flexShrink: 0
            }}>
              <button 
                className={`add-btn success form-collapse-btn ${showTPOForm ? 'form-open' : ''}`} 
                onClick={() => setShowTPOForm((v) => !v)} 
                style={{ padding: '6px 12px', fontSize: '13px', position: 'relative' }}
                data-form-status={showTPOForm ? 'open' : 'closed'}
              >
                <span className="btn-icon">{showTPOForm ? '−' : '+'}</span>
                {showTPOForm ? 'Close Form' : 'Add Training & Placement Officer'}
              </button>
            </div>
            {showTPOForm && (
              <div className="reg-form-box enhanced animate-slide-in" style={{
                marginBottom: '15px',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '2px solid #28a745',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 15px rgba(40, 167, 69, 0.15)',
                maxHeight: '380px',
                overflowY: 'auto',
                flexShrink: 0
              }}>
                <h3 style={{ color: '#28a745', marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>
                  🎯 Add New Training & Placement Officer
                </h3>
                <TrainingPlacementRegisterForm onSuccess={() => { setShowTPOForm(false); fetchTPOs(); }} />
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', margin: '0', fontWeight: '600', color: '#2d3748' }}>
                🎯 Training & Placement Officers
              </h3>
              <div className="student-count" style={{ fontSize: '12px' }}>
                <span className="count-badge" style={{ 
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontWeight: '600'
                }}>
                  {tpos.length} officers
                </span>
              </div>
            </div>
            
            <div className="enhanced-table-container" style={{ 
              flex: 1,
              minHeight: '300px',
              maxHeight: 'calc(100vh - 450px)',
              overflowY: 'auto',
              border: '1px solid #dee2e6',
              borderRadius: '12px',
              backgroundColor: 'white',
              position: 'relative'
            }}>
              {tpos.length === 0 ? (
                <div style={{ 
                  padding: '40px 20px', 
                  textAlign: 'center',
                  color: '#6b7280',
                  background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
                  borderRadius: '12px',
                  margin: '20px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎯</div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>No TPO officers found</h4>
                  <p style={{ margin: '0', fontSize: '14px' }}>
                    Add your first Training & Placement Officer to get started
                  </p>
                </div>
              ) : (
                <table className="dashboard-table" style={{ marginBottom: 0, fontSize: '13px', width: '100%' }}>
                  <thead style={{
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#f8f9fa',
                    zIndex: 10
                  }}>
                    <tr>
                      <th style={{ padding: '12px 16px', fontWeight: '700', color: '#374151' }}>👤 Name</th>
                      <th style={{ padding: '12px 16px', fontWeight: '700', color: '#374151' }}>🆔 Employee ID</th>
                      <th style={{ padding: '12px 16px', fontWeight: '700', color: '#374151', textAlign: 'center' }}>⚡ Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tpos.map((tpo, index) => (
                      <tr key={tpo.employeeId || tpo.tpdId} style={{
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                      }}>
                        <td style={{ padding: '10px 16px', fontWeight: '500' }}>{tpo.name}</td>
                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#059669' }}>{tpo.employeeId || tpo.tpdId}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <button 
                            className="delete-btn" 
                            onClick={() => deleteTPO(tpo.employeeId || tpo.tpdId)}
                            title="Delete Training & Placement Officer"
                            style={{ 
                              padding: '6px 12px', 
                              fontSize: '11px',
                              borderRadius: '8px',
                              fontWeight: '600'
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;