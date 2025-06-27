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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/studentDB", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ MongoDB connected successfully - PERMANENT STORAGE MODE");
    
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
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

// Default route
app.get("/", (req, res) => {
  res.json({ message: "🚀 Student API Running..." });
});

// Start server
app.listen(PORT, () => {
  console.log(`🟢 Backend running on http://localhost:${PORT}`);
});
