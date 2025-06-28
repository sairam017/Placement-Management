import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoginForm from './Login';

const LandingPage = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('admin');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [studentLoginUID, setStudentLoginUID] = useState('');
  const [studentLoginPassword, setStudentLoginPassword] = useState('');
  const [studentLoginError, setStudentLoginError] = useState('');
  const [studentLoginDepartment, setStudentLoginDepartment] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userDepartment, setUserDepartment] = useState('');

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setStudentLoginError('');

    try {
      let response;

      if (userType === 'admin') {
        if (userId === 'admin' && password === 'admin123') {
          alert('Admin Login successful!');
          navigate('/admin-dashboard');
          return;
        } else {
          setLoginError('Invalid admin credentials');
          return;
        }
      }

      if (userType === 'student') {
        response = await axios.post('http://localhost:5000/api/students/login', {
          UID: studentLoginUID.trim(),
          department: studentLoginDepartment.trim().toUpperCase(),
          password: studentLoginPassword,
        });
      } else if (userType === 'placement-coordinator') {
        response = await axios.post('http://localhost:5000/api/coordinators/login', {
          employeeId: userId.trim(),
          department: userDepartment.trim().toUpperCase(),
          password,
        });
      } else if (userType === 'training-placement-officer') {
        response = await axios.post('http://localhost:5000/api/tpos/login', {
          employeeId: userId.trim(),
          password,
        });
      }

      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (userType === 'placement-coordinator') {
          localStorage.setItem('coordinator', JSON.stringify(response.data.user));
        } else if (userType === 'training-placement-officer') {
          // Training placement officers also need coordinator data for TrainingPlacement.js
          localStorage.setItem('coordinator', JSON.stringify(response.data.data));
        }
        // Fix: For student, store response.data.data as 'user'
        if (userType === 'student') {
          localStorage.setItem('user', JSON.stringify(response.data.data));
        } else if (userType === 'training-placement-officer') {
          localStorage.setItem('user', JSON.stringify(response.data.data));
        } else {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        alert('Login successful!');
        let dashboardPath = '';
        switch (userType) {
          case 'admin':
            dashboardPath = '/admin-dashboard';
            break;
          case 'placement-coordinator':
            dashboardPath = '/placement-dashboard';
            break;
          case 'training-placement-officer':
            dashboardPath = '/training-placement-dashboard';
            break;
          case 'student':
            dashboardPath = '/student-dashboard';
            break;
          default:
            dashboardPath = '/';
        }

        navigate(dashboardPath);
      } else {
        if (userType === 'student') {
          setStudentLoginError('Invalid Student credentials');
        } else {
          setLoginError('Invalid credentials');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      if (userType === 'student') {
        setStudentLoginError(
          error.response?.data?.message || 'Failed to authenticate. Please check your credentials.'
        );
      } else {
        setLoginError(
          error.response?.data?.message || 'Failed to authenticate. Please check your credentials.'
        );
      }
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container">
          <h2 className="navbar-brand">Aurora Placement Management System</h2>
        </div>
      </nav>

      {/* Jumbotron */}
      <div className="jumbotron text-center bg-info text-white">
        <h1 className="display-4">Welcome to Aurora Placement Portal</h1>
        <p className="lead">Empowering students, connecting opportunities.</p>
      </div>

      {/* Login Form */}
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header text-center">Login</div>
              <div className="card-body">
                <LoginForm
                  userType={userType}
                  setUserType={setUserType}
                  userId={userId}
                  setUserId={setUserId}
                  password={password}
                  setPassword={setPassword}
                  loginError={loginError}
                  studentLoginUID={studentLoginUID}
                  setStudentLoginUID={setStudentLoginUID}
                  studentLoginPassword={studentLoginPassword}
                  setStudentLoginPassword={setStudentLoginPassword}
                  studentLoginError={studentLoginError}
                  studentLoginDepartment={studentLoginDepartment}
                  setStudentLoginDepartment={setStudentLoginDepartment}
                  showStudentPassword={showStudentPassword}
                  setShowStudentPassword={setShowStudentPassword}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  userDepartment={userDepartment}
                  setUserDepartment={setUserDepartment}
                  handleLogin={handleLogin}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-light text-center p-3 mt-5">
        &copy; {new Date().getFullYear()} Aurora Deemed to be University. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;