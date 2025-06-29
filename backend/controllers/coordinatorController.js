const Coordinator = require("../models/coordinatorModel");
const bcrypt = require("bcryptjs");

// Create (Register) Coordinator
exports.createCoordinator = async (req, res) => {
  try {
    const { name, employeeId, department, password } = req.body;

    if (!name || !employeeId || !department || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await Coordinator.findOne({ employeeId });
    if (existing) {
      return res.status(400).json({ message: "Employee ID already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const coordinator = await Coordinator.create({
      name,
      employeeId,
      department,
      password: hashedPassword
    });

    res.status(201).json({
      message: "Coordinator created",
      data: {
        name: coordinator.name,
        employeeId: coordinator.employeeId,
        department: coordinator.department
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all coordinators
exports.getAllCoordinators = async (req, res) => {
  try {
    const coordinators = await Coordinator.find().select("-password");
    res.json({ data: coordinators });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get coordinator by employeeId
exports.getCoordinatorById = async (req, res) => {
  try {
    const coordinator = await Coordinator.findOne({ employeeId: req.params.id }).select("-password");
    if (!coordinator) {
      return res.status(404).json({ message: "Coordinator not found" });
    }
    res.json({ data: coordinator });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update coordinator
exports.updateCoordinator = async (req, res) => {
  try {
    const { name, department } = req.body;
    const coordinator = await Coordinator.findOneAndUpdate(
      { employeeId: req.params.id },
      { name, department },
      { new: true, runValidators: true }
    ).select("-password");

    if (!coordinator) {
      return res.status(404).json({ message: "Coordinator not found" });
    }

    res.json({ message: "Coordinator updated", data: coordinator });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete coordinator
exports.deleteCoordinator = async (req, res) => {
  try {
    const coordinator = await Coordinator.findOneAndDelete({ employeeId: req.params.id });
    if (!coordinator) {
      return res.status(404).json({ message: "Coordinator not found" });
    }
    res.json({ message: "Coordinator deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Login coordinator
exports.loginCoordinator = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    const coordinator = await Coordinator.findOne({ employeeId });
    if (!coordinator) {
      return res.status(400).json({ message: "Invalid employeeId or password" });
    }

    const isMatch = await bcrypt.compare(password, coordinator.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid employeeId or password" });
    }

    res.json({
      message: "Login successful",
      user: {
        name: coordinator.name,
        employeeId: coordinator.employeeId,
        department: coordinator.department
      },
      token: "mySuperSecretKey123"  // Replace with JWT token generation if needed
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Change coordinator password
exports.changePassword = async (req, res) => {
  try {
    const { employeeId, currentPassword, newPassword } = req.body;

    if (!employeeId || !currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const coordinator = await Coordinator.findOne({ employeeId });
    if (!coordinator) {
      return res.status(404).json({ message: "Coordinator not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, coordinator.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    coordinator.password = hashedNewPassword;
    await coordinator.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
