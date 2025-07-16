const mongoose = require('mongoose');

const isDev = process.env.NODE_ENV !== 'production';

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/studentDB", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    if (isDev) console.log("Connected to MongoDB");
  } catch (err) {
    if (isDev) console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;