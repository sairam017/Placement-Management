import React, { useState } from 'react';

const TrainingPlacementRegisterForm = ({ onSuccess }) => {
  const [tpdName, setTpdName] = useState("");
  const [tpdId, setTpdId] = useState("");
  const [tpdDept, setTpdDept] = useState("");
  const [tpdPassword, setTpdPassword] = useState("");
  const [tpdRegError, setTpdRegError] = useState("");

  const handleTPDRegister = async (e) => {
    e.preventDefault();
    if (!tpdName || !tpdId || !tpdDept || !tpdPassword) {
      setTpdRegError('All fields are required');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/training-placement/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tpdName,
          tpdId,
          department: tpdDept,
          password: tpdPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Training & Placement Dept added successfully!');
        setTpdName(""); setTpdId(""); setTpdDept(""); setTpdPassword(""); setTpdRegError("");
        if (onSuccess) onSuccess();
      } else {
        setTpdRegError(data.message || 'Registration failed');
      }
    } catch (err) {
      setTpdRegError('Server error');
    }
  };

  return (
    <div className="card">
      <div className="card-header text-center">Add Training & Placement Dept</div>
      <div className="card-body">
        <form onSubmit={handleTPDRegister}>
          <div className="form-group mb-2">
            <label>Name</label>
            <input type="text" className="form-control" value={tpdName} onChange={e => setTpdName(e.target.value)} />
          </div>
          <div className="form-group mb-2">
            <label>TPD ID</label>
            <input type="text" className="form-control" value={tpdId} onChange={e => setTpdId(e.target.value)} />
          </div>
          <div className="form-group mb-2">
            <label>Department</label>
            <input type="text" className="form-control" value={tpdDept} onChange={e => setTpdDept(e.target.value)} />
          </div>
          <div className="form-group mb-2">
            <label>Password</label>
            <input type="password" className="form-control" value={tpdPassword} onChange={e => setTpdPassword(e.target.value)} />
          </div>
          {tpdRegError && <div className="text-danger mb-2">{tpdRegError}</div>}
          <button type="submit" className="btn btn-success btn-block">Add T&P Dept</button>
          <button type="button" className="btn btn-link mt-2" onClick={onSuccess}>Back</button>
        </form>
      </div>
    </div>
  );
};

export default TrainingPlacementRegisterForm;
