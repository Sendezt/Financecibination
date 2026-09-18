require("dotenv").config();
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // Prioritas: HttpOnly cookie → fallback ke Authorization: Bearer header
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  if (!token) {
    return res
      .status(401)
      .json({ status: false, message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded; // Menyimpan payload token (id, email, role, dll)
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ status: false, message: "Token sudah kedaluwarsa." });
    }
    return res
      .status(403)
      .json({ status: false, message: "Token tidak valid." });
  }
};

module.exports = verifyToken;
