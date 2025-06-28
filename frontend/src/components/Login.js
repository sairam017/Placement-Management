import React from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginForm = ({
  userType,
  setUserType,
  userId,
  setUserId,
  password,
  setPassword,
  loginError,
  studentLoginUID,
  setStudentLoginUID,
  studentLoginPassword,
  setStudentLoginPassword,
  studentLoginError,
  studentLoginDepartment,
  setStudentLoginDepartment,
  showStudentPassword,
  setShowStudentPassword,
  showPassword,
  setShowPassword,
  userDepartment,
  setUserDepartment,
  handleLogin
}) => {
  return (
    <form onSubmit={handleLogin}>
      <div className="form-group mb-2">
        <label>User Type</label>
        <select
          className="form-control"
          value={userType}
          onChange={(e) => setUserType(e.target.value)}
        >
          <option value="admin">Admin</option>
          <option value="placement-coordinator">Placement Coordinator</option>
          <option value="training-placement-officer">Training and Placement Officer</option>
          <option value="student">Student</option>
        </select>
      </div>
      {userType === 'student' ? (
        <>
          <div className="form-group mb-2">
            <label>UID</label>
            <input
              type="text"
              className="form-control"
              value={studentLoginUID}
              onChange={(e) => setStudentLoginUID(e.target.value)}
            />
          </div>
          <div className="form-group mb-2">
            <label>Department</label>
            <select
              className="form-control"
              value={studentLoginDepartment}
              onChange={(e) => setStudentLoginDepartment(e.target.value)}
            >
              <option value="">Select Department</option>
              <option value="MCA">MCA</option>
              <option value="MBA">MBA</option>
            </select>
          </div>
          <div className="form-group mb-2 position-relative">
            <label>Password</label>
            <input
              type={showStudentPassword ? "text" : "password"}
              className="form-control"
              value={studentLoginPassword}
              onChange={(e) => setStudentLoginPassword(e.target.value)}
              autoComplete="current-password"
            />
            <span
              style={{ position: 'absolute', right: 12, top: 38, cursor: 'pointer' }}
              onClick={() => setShowStudentPassword((v) => !v)}
              aria-label={showStudentPassword ? 'Hide password' : 'Show password'}
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') setShowStudentPassword((v) => !v);
              }}
            >
              {showStudentPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {studentLoginError && (
            <div className="text-danger mb-2">{studentLoginError}</div>
          )}
        </>
      ) : userType === 'placement-coordinator' ? (
        <>
          <div className="form-group mb-2">
            <label>Employee ID</label>
            <input
              type="text"
              className="form-control"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <div className="form-group mb-2">
            <label>Department</label>
            <select
              className="form-control"
              value={userDepartment}
              onChange={(e) => setUserDepartment(e.target.value)}
            >
              <option value="">Select Department</option>
              <option value="MCA">MCA</option>
              <option value="MBA">MBA</option>
            </select>
          </div>
          <div className="form-group mb-2 position-relative">
            <label>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              style={{ position: 'absolute', right: 12, top: 38, cursor: 'pointer' }}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {loginError && <div className="text-danger mb-2">{loginError}</div>}
        </>
      ) : userType === 'training-placement-officer' ? (
        <>
          <div className="form-group mb-2">
            <label>Employee ID</label>
            <input
              type="text"
              className="form-control"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <div className="form-group mb-2 position-relative">
            <label>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              style={{ position: 'absolute', right: 12, top: 38, cursor: 'pointer' }}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {loginError && <div className="text-danger mb-2">{loginError}</div>}
        </>
      ) : (
        <>
          <div className="form-group mb-2">
            <label>UID</label>
            <input
              type="text"
              className="form-control"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter UID (1111)"
            />
          </div>
          <div className="form-group mb-2 position-relative">
            <label>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
            <span
              style={{ position: 'absolute', right: 12, top: 38, cursor: 'pointer' }}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {loginError && <div className="text-danger mb-2">{loginError}</div>}
        </>
      )}
      <button type="submit" className="btn btn-primary btn-block w-100">
        Login
      </button>
    </form>
  );
};

export default LoginForm;