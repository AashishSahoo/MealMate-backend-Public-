// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { upload } = require("../middleware/upload");

// console.log("authController:", authController);

router.post("/login", authController.login);
router.post("/register/customer", authController.registerCustomer);
router.post(
  "/register/restaurant-owner",
  upload.fields([{ name: "appLogo" }, { name: "document" }]),
  authController.registerRestaurantOwner
);
router.post("/register/admin", authController.registerAdmin);

router.post("/request-verification", authController.requestEmailVerification);

router.post("/verify-otp", authController.verifyEmail);

module.exports = router;
