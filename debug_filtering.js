// Debug script to test filtering logic
const axios = require('axios');

async function testFiltering() {
  try {
    console.log('🔍 Testing Student Filtering Logic...\n');
    
    // Fetch students from API
    const response = await axios.get('http://localhost:5000/api/students/all');
    const students = response.data.data || [];
    
    console.log(`📊 Total students fetched: ${students.length}\n`);
    
    // Analyze departments
    const departments = [...new Set(students.map(s => s.department).filter(d => d))];
    console.log('🏢 Available departments:', departments);
    console.log('🏢 Department counts:');
    departments.forEach(dept => {
      const count = students.filter(s => s.department === dept).length;
      console.log(`   - ${dept}: ${count} students`);
    });
    
    console.log('\n🔍 Testing filtering logic:');
    
    // Test MCA filtering
    const mcaStudents = students.filter(student =>
      student.department?.toLowerCase() === 'mca'
    );
    console.log(`\n📚 MCA Students: ${mcaStudents.length}`);
    mcaStudents.slice(0, 5).forEach(s => {
      console.log(`   - ${s.name} (${s.UID}) - ${s.department} - ${s.section}`);
    });
    if (mcaStudents.length > 5) {
      console.log(`   ... and ${mcaStudents.length - 5} more`);
    }
    
    // Test MBA filtering
    const mbaStudents = students.filter(student =>
      student.department?.toLowerCase() === 'mba'
    );
    console.log(`\n🎓 MBA Students: ${mbaStudents.length}`);
    mbaStudents.forEach(s => {
      console.log(`   - ${s.name} (${s.UID}) - ${s.department} - ${s.section}`);
    });
    
    // Test UID search
    console.log('\n🔎 Testing UID search with "10":');
    const uidSearchResults = students.filter(student =>
      student.UID?.toLowerCase().includes('10')
    );
    console.log(`Found ${uidSearchResults.length} students with UID containing "10"`);
    uidSearchResults.slice(0, 5).forEach(s => {
      console.log(`   - ${s.name} (${s.UID}) - ${s.department}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFiltering();
