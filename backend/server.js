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
    console.log("✅ MongoDB connected successfully");
    
    // Fix any existing index issues
    try {
      const Company = require("./models/Company");
      await Company.collection.dropIndex("name_1");
      console.log("✅ Dropped problematic name_1 index");
    } catch (indexError) {
      console.log("ℹ️  No problematic index to drop or already dropped");
    }
    
    // Clean up any documents with null names
    try {
      const Company = require("./models/Company");
      const deletedCount = await Company.deleteMany({ 
        $or: [
          { name: null }, 
          { name: { $exists: false } },
          { companyName: null },
          { companyName: { $exists: false } }
        ] 
      });
      if (deletedCount.deletedCount > 0) {
        console.log(`✅ Cleaned up ${deletedCount.deletedCount} invalid company documents`);
      }
    } catch (cleanupError) {
      console.log("ℹ️  No cleanup needed or cleanup failed:", cleanupError.message);
    }
    
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

// Default route
app.get("/", (req, res) => {
  res.json({ message: "🚀 Student API Running..." });
});

// Start server
app.listen(PORT, () => {
  console.log(`🟢 Backend running on http://localhost:${PORT}`);
});
