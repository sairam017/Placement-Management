const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const studentRoutes = require("./routes/studentRoutes");
const companyRoutes = require("./routes/companyRoutes");
const studentPlacementRoutes = require("./routes/studentPlacementRoutes");
const coordinatorRoutes = require("./routes/coordinatorRoutes");
const tpoRoutes = require("./routes/tpoRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const adminLoginRoutes = require("./routes/adminLoginRoutes");

// Import admin initialization
const { initializeDefaultAdmin } = require("./controllers/adminLoginController");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isDev = process.env.NODE_ENV !== 'production';

app.use(cors());
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/studentDB", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    if (isDev) console.log("✅ MongoDB connected successfully");
    
    // Initialize default admin after DB connection
    await initializeDefaultAdmin();
    
  } catch (err) {
    if (isDev) console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

connectDB();

// Serve uploads statically
app.use('/uploads/resumes', express.static(path.join(__dirname, 'uploads/resumes')));
app.use('/uploads/profile_photos', express.static(path.join(__dirname, 'uploads/profile_photos')));

// Routes
app.use("/api/students", studentRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/coordinators", coordinatorRoutes);
app.use("/api/tpos", tpoRoutes);
app.use("/api/student-placement", studentPlacementRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/admin", adminLoginRoutes);

// Default route
app.get("/", (req, res) => {
  res.json({ message: "🚀 Student API Running..." });
});

// Start server
app.listen(PORT, () => {
  if (isDev) console.log(`🟢 Backend running on http://localhost:${PORT}`);
});
