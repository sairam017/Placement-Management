const jwt = require("jsonwebtoken");
const JWT_SECRET = "mysecretkey";

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) // Remove 'Bearer ' prefix
    : authHeader;

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: "Access denied. No token provided." 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;  // Attach user data to request
    next();
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: "Invalid token." 
    });
  }
};
