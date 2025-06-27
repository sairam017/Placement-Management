import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const PlacementDashboard = () => {
  const [studentPlacements, setStudentPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coordinator, setCoordinator] = useState(null);
  const [filter, setFilter] = useState("all");
  const [filterCompany, setFilterCompany] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [packageCTC, setPackageCTC] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);

  const [companies, setCompanies] = useState([]); // List of companies from backend
  const [companyMap, setCompanyMap] = useState({}); // { companyName: companyId }

  const fetchCoordinatorAndData = async () => {
    const token = localStorage.getItem("token");
    let coordRaw = localStorage.getItem("coordinator");
    let coord;
    try {
      coord = coordRaw ? JSON.parse(coordRaw) : null;
    } catch {
      coord = null;
    }

    if (!coord || !token) {
      window.location.href = "/";
      return;
    }

    setCoordinator(coord);

    try {
      const res = await axios.get(
        `http://localhost:5000/api/student-placement/department/${coord.department}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = Array.isArray(res.data) ? res.data : [];
      setStudentPlacements(data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/companies/all");
        console.log("Companies response:", res.data); // Debug log
        if (Array.isArray(res.data.data)) {
          setCompanies(res.data.data);
          const map = {};
          res.data.data.forEach((c) => {
            map[c.companyName] = c._id;
          });
          setCompanyMap(map);
        } else if (Array.isArray(res.data)) {
          setCompanies(res.data);
          const map = {};
          res.data.forEach((c) => {
            map[c.companyName] = c._id;
          });
          setCompanyMap(map);
        }
      } catch (err) {
        console.error("Error fetching companies:", err);
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchCoordinatorAndData();
  }, []);

  // When filterCompany changes, reset filter to 'all' to always show all students for that company by default
  useEffect(() => {
    if (filterCompany) {
      setFilter('all');
    }
  }, [filterCompany]);

  // Filtered students by company
  if (filterCompany) {
    // Filter logic for specific company (if needed for future features)
  }

  const handleAddPlacement = async () => {
    if (!companyName || !packageCTC || !role || !description) {
      alert("Please fill all required fields (Company Name, CTC, Role, Description).");
      return;
    }

    if (!coordinator?.department) {
      alert("Department information is missing.");
      return;
    }

    try {
      const payload = {
        companyName,
        ctc: parseFloat(packageCTC),
        role,
        description,
        department: coordinator.department,
        studentUIDs: selectedStudents
      };

      console.log("Sending payload:", payload); // Debug log

      const response = await axios.post(`http://localhost:5000/api/companies`, payload);
      
      console.log("Response:", response.data); // Debug log

      alert("Company added successfully!");

      setCompanyName("");
      setPackageCTC("");
      setRole("");
      setDescription("");
      setSelectedStudents([]);

      // Refresh companies list
      const fetchCompanies = async () => {
        try {
          const res = await axios.get("http://localhost:5000/api/companies/all");
          if (Array.isArray(res.data.data)) {
            setCompanies(res.data.data);
            const map = {};
            res.data.data.forEach((c) => {
              map[c.companyName] = c._id;
            });
            setCompanyMap(map);
          }
        } catch (err) {
          console.error("Error fetching companies:", err);
        }
      };
      await fetchCompanies();

    } catch (err) {
      console.error("Error adding company:", err);
      console.error("Error response:", err.response?.data); // Debug log
      alert(`Failed to add company: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDownloadExcel = () => {
    const exportData = filteredStudents.map((s, idx) => ({
      "#": idx + 1,
      Name: s.name,
      UID: s.UID,
      Section: s.section,
      MailID: s.mailid,
      Mobile: s.mobile,
      Relocate: s.relocate ? "Yes" : "No",
      ResumeURL: s.resumeUrl ? `http://localhost:5000${s.resumeUrl}` : "-"
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Placements");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "placements.xlsx");
  };

  const handleStudentSelect = (uid) => {
    setSelectedStudents(prev => {
      if (prev.includes(uid)) {
        return prev.filter(id => id !== uid);
      } else {
        return [...prev, uid];
      }
    });
  };

  const handleSelectAllStudents = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.UID));
    }
  };

  // Helper to check if student applied to selected company (by companyId)
  const isAppliedToCompany = (student, companyId) => {
    return (
      Array.isArray(student.applications) &&
      student.applications.some((app) => app.companyId === companyId && app.status !== "not applied")
    );
  };
  // Helper to check if student has any application
  const hasAnyApplication = (student) => {
    return Array.isArray(student.applications) && student.applications.some((app) => app.status !== "not applied");
  };

  // Filtering logic
  const getFilteredStudents = () => {
    if (filterCompany) {
      const companyId = companyMap[filterCompany];
      if (filter === "applied") {
        return studentPlacements.filter((s) => isAppliedToCompany(s, companyId));
      } else if (filter === "not_applied") {
        return studentPlacements.filter((s) => !isAppliedToCompany(s, companyId));
      } else {
        // all
        return studentPlacements;
      }
    } else {
      if (filter === "applied") {
        return studentPlacements.filter((s) => hasAnyApplication(s));
      } else if (filter === "not_applied") {
        return studentPlacements.filter((s) => !hasAnyApplication(s));
      } else {
        // all
        return studentPlacements;
      }
    }
  };
  const filteredStudents = getFilteredStudents();

  return (
    <div className="container mt-4 position-relative">
      <button
        className="btn btn-danger position-absolute"
        style={{ top: 0, right: 0 }}
        onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("coordinator");
          window.location.href = "/";
        }}
      >
        Logout
      </button>

      <h2>Welcome, {coordinator?.name}</h2>
      <p><strong>Department:</strong> {coordinator?.department}</p>

      <div className="d-flex justify-content-between mb-3 align-items-center">
        <div className="d-flex align-items-center">
          {/* Company Filter Dropdown */}
          <select
            className="form-select form-select-sm me-2"
            style={{ width: 220, display: "inline-block" }}
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
          >
            <option value="">-- Filter by Company --</option>
            {companies.map((c) => (
              <option key={c._id} value={c.companyName}>{c.companyName}</option>
            ))}
          </select>
          <button
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
            onClick={() => setFilter("all")}
            type="button"
          >
            All Students
          </button>
          <button
            className={`btn btn-sm ${filter === 'applied' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
            onClick={() => setFilter("applied")}
            type="button"
          >
            Applied
          </button>
          <button
            className={`btn btn-sm ${filter === 'not_applied' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilter("not_applied")}
            type="button"
          >
            Not Applied
          </button>
        </div>
        <button className="btn btn-outline-success" onClick={handleDownloadExcel} type="button">
          Download Excel
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                  onChange={handleSelectAllStudents}
                />
              </th>
              <th>#</th>
              <th>Name</th>
              <th>UID</th>
              <th>Section</th>
              <th>Mail</th>
              <th>Mobile</th>
              <th>Relocate</th>
              <th>Resume</th>
              <th>Applied</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s, idx) => (
              <tr key={s.UID}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(s.UID)}
                    onChange={() => handleStudentSelect(s.UID)}
                  />
                </td>
                <td>{idx + 1}</td>
                <td>{s.name}</td>
                <td>{s.UID}</td>
                <td>{s.section}</td>
                <td>{s.mailid}</td>
                <td>{s.mobile}</td>
                <td>{s.relocate ? "Yes" : "No"}</td>
                <td>
                  {s.resumeUrl ? (
                    <a href={`http://localhost:5000${s.resumeUrl}`} target="_blank" rel="noopener noreferrer">View</a>
                  ) : "-"}
                </td>
                <td>
                  {filterCompany
                    ? isAppliedToCompany(s, companyMap[filterCompany]) ? "Yes" : "No"
                    : hasAnyApplication(s) ? "Yes" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h4>Add Company</h4>
      <div className="row g-2 mb-3">
        <div className="col-md-3">
          <select
            className="form-control"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          >
            <option value="">Select Company</option>
            <optgroup label="MNC Companies">
              <option value="Google India">Google India</option>
              <option value="Microsoft India">Microsoft India</option>
              <option value="Amazon India">Amazon India</option>
              <option value="IBM India">IBM India</option>
              <option value="Accenture India">Accenture India</option>
              <option value="TCS (Tata Consultancy Services)">TCS (Tata Consultancy Services)</option>
              <option value="Infosys">Infosys</option>
              <option value="Wipro">Wipro</option>
              <option value="Capgemini India">Capgemini India</option>
              <option value="Cognizant Technology Solutions India">Cognizant Technology Solutions India</option>
            </optgroup>
            <optgroup label="Startup Companies">
              <option value="Zerodha">Zerodha</option>
              <option value="CRED">CRED</option>
              <option value="Swiggy">Swiggy</option>
              <option value="Zomato">Zomato</option>
              <option value="BYJU’S">BYJU’S</option>
              <option value="Unacademy">Unacademy</option>
              <option value="Razorpay">Razorpay</option>
              <option value="PhonePe">PhonePe</option>
              <option value="Groww">Groww</option>
              <option value="Meesho">Meesho</option>
              <option value="Delhivery">Delhivery</option>
              <option value="Nykaa">Nykaa</option>
              <option value="OYO Rooms">OYO Rooms</option>
              <option value="Boat">Boat</option>
              <option value="Udaan">Udaan</option>
              <option value="Paytm">Others</option>
            </optgroup>
          </select>
        </div>
        <div className="col-md-2">
          <input
            type="number"
            step="0.1"
            className="form-control"
            placeholder="CTC (LPA)"
            value={packageCTC}
            onChange={(e) => setPackageCTC(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <input
            type="text"
            className="form-control"
            placeholder="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <input
            type="text"
            className="form-control"
            placeholder="Job Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <button className="btn btn-success" onClick={handleAddPlacement}>
            ADD
          </button>
        </div>
      </div>
      <div className="row g-2 mb-3">
        <div className="col-md-12">
          <div className="alert alert-info">
            <strong>Selected Students:</strong> {selectedStudents.length > 0 ? selectedStudents.join(', ') : 'None selected'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlacementDashboard;
