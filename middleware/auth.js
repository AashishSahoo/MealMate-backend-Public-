const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "123";

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res.status(403).json({
      resultCode: 1,
      resultData: {},
      resultMessage: "Token required",
    });

  //  res.status(403).json({ message: "Token required" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    if (!req.user.id || !req.user.roleType) {
      throw new Error("Token payload incomplete");
    }
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return res
      .status(401)
      .json({ resultCode: 1, resultMessage: "Invalid or expired token" });
  }
};

const roleCheck = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.roleType)) {
    return res
      .status(403)
      .json({ resultCode: 1, resultMessage: "Access denied" });
  }
  next();
};

module.exports = { verifyToken, roleCheck };
