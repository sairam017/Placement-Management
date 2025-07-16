// Debug script to test filtering logic
const axios = require('axios');

async function testFiltering() {
  try {
    // Fetch students from API
    const response = await axios.get('http://localhost:5000/api/students/all');
    const students = response.data.data || [];
    // Analyze departments
    const departments = [...new Set(students.map(s => s.department).filter(d => d))];
    // Test MCA filtering
    const mcaStudents = students.filter(student =>
      student.department?.toLowerCase() === 'mca'
    );
    // Test MBA filtering
    const mbaStudents = students.filter(student =>
      student.department?.toLowerCase() === 'mba'
    );
    // Test UID search
    const uidSearchResults = students.filter(student =>
      student.UID?.toLowerCase().includes('10')
    );
    // No output
  } catch (error) {
    // No error logging
  }
}

testFiltering();
