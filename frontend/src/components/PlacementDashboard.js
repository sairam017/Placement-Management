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
  const [studentUIDInput, setStudentUIDInput] = useState("");
  const [selectedUIDs, setSelectedUIDs] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

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
        const res = await axios.get("http://localhost:5000/api/placement/companies");
        if (Array.isArray(res.data)) {
          setCompanies(res.data);
          const map = {};
          res.data.forEach((c) => {
            map[c.companyName] = c._id;
          });
          setCompanyMap(map);
        }
      } catch (err) {
        // handle error
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
  let appliedStudents = [];
  let notAppliedStudents = [];
  if (filterCompany) {
    appliedStudents = studentPlacements.filter((s) =>
      Array.isArray(s.placements) &&
      s.placements.some((p) => p.companyName === filterCompany)
    );
    notAppliedStudents = studentPlacements.filter((s) =>
      !Array.isArray(s.placements) ||
      !s.placements.some((p) => p.companyName === filterCompany)
    );
  } else {
    appliedStudents = studentPlacements.filter((s) => s.hasPlacement);
    notAppliedStudents = studentPlacements.filter((s) => !s.hasPlacement);
  }

  const handleSelectAll = () => {
    if (!selectAll) {
      const allUIDs = filteredStudents.map((s) => s.UID);
      setSelectedUIDs(allUIDs);
    } else {
      setSelectedUIDs([]);
    }
    setSelectAll(!selectAll);
  };

  const handleSelectStudent = (uid) => {
    setSelectedUIDs((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleAddPlacement = async () => {
    let targetUIDs = [];

    if (studentUIDInput.trim()) {
      targetUIDs = [studentUIDInput.trim()];
    } else if (selectedUIDs.length > 0) {
      targetUIDs = selectedUIDs;
    }

    if (!companyName || !packageCTC || !role || targetUIDs.length === 0) {
      alert("Please fill all fields and select or enter at least one UID.");
      return;
    }

    try {
      const payload = {
        studentUID: targetUIDs,
        companyName,
        ctc: parseFloat(packageCTC),
        role,
        description
      };

      await axios.post(`http://localhost:5000/api/placement/placements`, payload);

      alert("Placement added!");

      setCompanyName("");
      setPackageCTC("");
      setRole("");
      setDescription("");
      setStudentUIDInput("");
      setSelectedUIDs([]);
      setSelectAll(false);

      setLoading(true);
      await fetchCoordinatorAndData();

    } catch (err) {
      console.error("Error adding placement:", err);
      alert("Failed to add placement.");
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

  // Helper to check if student applied to selected company (by companyId)
  const isAppliedToCompany = (student, companyId) => {
    return (
      Array.isArray(student.applications) &&
      student.applications.some((app) => app.companyId === companyId && app.applied)
    );
  };
  // Helper to check if student has any application
  const hasAnyApplication = (student) => {
    return Array.isArray(student.applications) && student.applications.some((app) => app.applied);
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

      <h4>Add Placement</h4>
      <div className="row g-2 mb-3">
        <div className="col-md-3">
          <input
            type="text"
            className="form-control"
            placeholder="Enter UID (optional)"
            value={studentUIDInput}
            onChange={(e) => setStudentUIDInput(e.target.value)}
            disabled={selectedUIDs.length > 0}
          />
        </div>
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
        <div className="col-md-2">
          <input
            type="text"
            className="form-control"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="col-md-1">
          <button className="btn btn-success" onClick={handleAddPlacement}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlacementDashboard;

// Example function for applying to a company (ensure UID is sent as a number)
const applyForCompany = async (uid, companyId) => {
  try {
    const response = await axios.post('http://localhost:5000/api/student-placement/apply', {
      UID: Number(uid), // Always send as number
      companyId
    });
    // handle response
  } catch (err) {
    // handle error
  }
};
