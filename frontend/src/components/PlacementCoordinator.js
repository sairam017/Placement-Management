import React, { useState } from "react";
import axios from "axios";

const PlacementCoordinatorForm = ({ onSuccess }) => {
  const [form, setForm] = useState({ name: "", employeeId: "", department: "", password: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post("http://localhost:5000/api/coordinators/coordinator", form);
    if (onSuccess) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
      <input name="employeeId" placeholder="Employee ID" value={form.employeeId} onChange={handleChange} required />
      <input name="department" placeholder="Department" value={form.department} onChange={handleChange} required />
      <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
      <button type="submit">Add Placement Coordinator</button>
    </form>
  );
};

export default PlacementCoordinatorForm;