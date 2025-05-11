const express = require("express");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

const reportControlles = require("../controllers/reportController");

router.get(
  `/monthlyProductSales/:email`,
  verifyToken,
  reportControlles.monthlyProductReports
);
module.exports = router;
