import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './LandingPage.css'; // Import the new CSS file
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoginForm from './Login';

const LandingPage = () => {
  const navigate = useNavigate();
  const [showLoginForm, setShowLoginForm] = useState(false);
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
        // Use dynamic admin login API
        response = await axios.post('http://localhost:5000/api/admin/login', {
          uid: userId.trim(),
          password: password,
        });
        
        if (response.data && response.data.success) {
          localStorage.setItem('adminToken', response.data.token);
          localStorage.setItem('adminData', JSON.stringify(response.data.admin));
          alert('Admin Login successful!');
          navigate('/admin-dashboard');
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
    <div className="landing-page">
      {/* Top Header with Login Button */}
      <header className="top-header">
        <div className="header-content">
          <div className="header-left">
            <h2 className="portal-title">Aurora Placement Portal</h2>
          </div>
          <div className="header-right">
            {!showLoginForm && (
              <button 
                className="login-trigger-btn-top"
                onClick={() => setShowLoginForm(true)}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Water Animation Container */}
        <div className="water-animation-container">
          <div className="water-wave wave1"></div>
          <div className="water-wave wave2"></div>
          <div className="water-wave wave3"></div>
          <div className="water-drop drop1"></div>
          <div className="water-drop drop2"></div>
          <div className="water-drop drop3"></div>
        </div>

        {/* Welcome Text */}
        <div className="welcome-content">
          <h1 className="main-title">Welcome to Aurora Placements</h1>
          <p className="main-subtitle">Empowering students, connecting opportunities</p>
        </div>

        {/* Login Form Modal */}
        {showLoginForm && (
          <div className="login-modal-overlay">
            <div className="login-form-container">
              <div className="login-card">
                <div className="login-card-header">
                  <h3>Login to Your Account</h3>
                  <button 
                    className="close-btn"
                    onClick={() => setShowLoginForm(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="login-card-body">
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
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          &copy; {new Date().getFullYear()} Aurora Deemed to be University. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;