import React, { useState } from "react";
import axios from "axios";

const TPOForm = ({ onSuccess }) => {
  const [form, setForm] = useState({ name: "", employeeId: "", password: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post("http://localhost:5000/api/tpos/", form);
    if (onSuccess) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
      <input name="employeeId" placeholder="Employee ID" value={form.employeeId} onChange={handleChange} required />
      <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
      <button type="submit">Add TPO</button>
    </form>
  );
};

export default TPOForm;
