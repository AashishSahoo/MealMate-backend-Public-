const express = require("express");
const router = express.Router();
const {
  approveRestroOwner,
  declineRestroOwner,
} = require("../controllers/restaurantController");
// const authMiddleware = require("../middleware/auth");
const { verifyToken } = require("../middleware/auth");

router.put(
  "/approve/:id",
  verifyToken,
  (req, res, next) => {
    if (req.user.roleType !== "admin")
      return res.status(403).json({ error: "Access denied" });
    next();
  },
  approveRestroOwner
);

router.put(
  "/decline/:id",
  verifyToken,
  (req, res, next) => {
    if (req.user.roleType !== "admin")
      return res.status(403).json({ error: "Access denied" });
    next();
  },
  declineRestroOwner
);

module.exports = router;
