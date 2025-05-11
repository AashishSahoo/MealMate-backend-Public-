const Razorpay = require("razorpay");
const crypto = require("crypto");
const dotenv = require("dotenv");
const express = require("express");
const { verifyToken } = require("../middleware/auth");
const paymentController = require("../controllers/paymentController");

const router = express.Router();

router.post("/createOrder", verifyToken, paymentController.createOrder);
router.post("/verifyPayment", verifyToken, paymentController.verifyPayment);

module.exports = router;
