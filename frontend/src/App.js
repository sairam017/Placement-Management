import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import all page components
import LandingPage from './components/LandingPage';
import LoginForm from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import PlacementCoordinator from './components/PlacementCoordinator';
import TrainingPlacement from './components/TrainingPlacement';
import StudentDashboard from './components/StudentDashboard';
import PlacementDashboard from './components/PlacementDashboard';
import StudentPlacementRegisterForm from './components/StudentPlacementRegisterForm';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected Routes */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/placement-coordinator" element={<PlacementCoordinator />} />
        <Route path="/placement-dashboard" element={<PlacementDashboard />} /> 
        <Route path="/training-placement-dashboard" element={<TrainingPlacement />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/register-placement" element={<StudentPlacementRegisterForm />} />

        {/* 404 - Not Found Route */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;