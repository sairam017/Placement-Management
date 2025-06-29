const TPO = require("../models/tpoModel");
const bcrypt = require("bcryptjs");

// Create TPO
exports.createTPO = async (req, res) => {
  try {
    const { name, employeeId, password } = req.body;

    if (!name || !employeeId || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await TPO.findOne({ employeeId });
    if (existing) {
      return res.status(400).json({ message: "Employee ID already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const tpo = await TPO.create({
      name,
      employeeId,
      password: hashedPassword,
    });

    const tpoData = {
      name: tpo.name,
      employeeId: tpo.employeeId
    };

    res.status(201).json({ message: "TPO created", data: tpoData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All TPOs
exports.getAllTPOs = async (req, res) => {
  try {
    const tpos = await TPO.find().select("-password");
    res.json({ data: tpos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get TPO by ID
exports.getTPOById = async (req, res) => {
  try {
    const tpo = await TPO.findById(req.params.id).select("-password");
    if (!tpo) {
      return res.status(404).json({ message: "TPO not found" });
    }
    res.json({ data: tpo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update TPO
exports.updateTPO = async (req, res) => {
  try {
    const { name } = req.body;
    const tpo = await TPO.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true }
    ).select("-password");
    if (!tpo) {
      return res.status(404).json({ message: "TPO not found" });
    }
    res.json({ message: "TPO updated", data: tpo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete TPO
exports.deleteTPO = async (req, res) => {
  try {
    const tpo = await TPO.findByIdAndDelete(req.params.id);
    if (!tpo) {
      return res.status(404).json({ message: "TPO not found" });
    }
    res.json({ message: "TPO deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login TPO
exports.loginTPO = async (req, res) => {
  const { employeeId, password } = req.body;

  try {
    const tpo = await TPO.findOne({ employeeId });
    if (!tpo) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, tpo.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const tpoData = {
      name: tpo.name,
      employeeId: tpo.employeeId
    };

    res.json({
      message: "Login successful",
      data: tpoData,
      token: "dummy-token" // Replace with JWT if you want token
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Change TPO Password
exports.changeTPOPassword = async (req, res) => {
  const { employeeId, currentPassword, newPassword } = req.body;

  try {
    if (!employeeId || !currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const tpo = await TPO.findOne({ employeeId });
    if (!tpo) {
      return res.status(404).json({ message: "TPO not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, tpo.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ message: "New password must be at least 4 characters long" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    tpo.password = hashedNewPassword;
    await tpo.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing TPO password:", error);
    res.status(500).json({ message: "Server error" });
  }
};
