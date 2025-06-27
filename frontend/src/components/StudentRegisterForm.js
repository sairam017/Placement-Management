import React, { useState } from 'react';
import axios from 'axios';

function StudentRegisterForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    UID: '',
    department: '',
    section: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/students/create', formData);
      alert('Student registered successfully');
      if (onSuccess) onSuccess();
    } catch (error) {
      alert('Error registering student');
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <input name="name" onChange={handleChange} placeholder="Full Name" />
      <input name="UID" onChange={handleChange} placeholder="UID" />
      <input name="department" onChange={handleChange} placeholder="Department" />
      <input name="section" onChange={handleChange} placeholder="Section" />
      <input name="password" type="password" onChange={handleChange} placeholder="Password" />
      <button type="submit">Register</button>
    </form>
  );
}

export default StudentRegisterForm;
