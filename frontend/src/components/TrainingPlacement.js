import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import Axios for API calls
import './TrainingPlacement.css';

const TrainingPlacement = () => {
  const [departments, setDepartments] = useState([]);
  const [newDept, setNewDept] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [studentData, setStudentData] = useState({});

  // Fetch departments from API
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/departments'); // Replace with your API endpoint
        setDepartments(response.data);
        if (response.data.length > 0) {
          setSelectedDept(response.data[0]); // Set the first department as default
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    fetchDepartments();
  }, []);

  // Fetch student data for the selected department
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/students/${selectedDept}`); // Replace with your API endpoint
        setStudentData(response.data);
      } catch (error) {
        console.error("Error fetching student data:", error);
      }
    };

    if (selectedDept) {
      fetchStudentData();
    }
  }, [selectedDept]);

  // Handle adding a new department
  const handleAddDepartment = () => {
    const dept = newDept.toUpperCase().trim();
    if (dept && !departments.includes(dept)) {
      setDepartments([...departments, dept]);
      setNewDept('');
    }
  };

  return (
    <div className="tp-container">
      <h2 className="tp-title">Welcome Training and Placement Department</h2>

      <div className="tp-panel">
        <div className="tp-left">
          <label className="tp-label">Select Department:</label>
          <select
            className="tp-dropdown"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            {departments.map((dept, index) => (
              <option key={index} value={dept}>{dept}</option>
            ))}
          </select>

          <div className="add-dept-form">
            <input
              type="text"
              placeholder="Add Department"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              className="dept-input"
            />
            <button onClick={handleAddDepartment} className="add-btn">Add</button>
          </div>
        </div>

        <div className="tp-right">
          <h3 className="dept-heading">Department Selected: {selectedDept}</h3>

          <div className="student-section">
            <h4>Students Info:</h4>
            <div className="student-list">
              {studentData[selectedDept] ? (
                studentData[selectedDept].map((student, index) => (
                  <div key={index} className="student-card">
                    <p><strong>Name:</strong> {student.name}</p>
                    <p><strong>UID:</strong> {student.uid}</p>
                    <p><strong>Section:</strong> {student.section}</p>
                  </div>
                ))
              ) : (
                <p className="no-data">No student data available for this department.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingPlacement;