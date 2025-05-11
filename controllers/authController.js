const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendWelcomeEmail } = require("../utils/emailService");
const connectDB = require("../config/db");
const path = require("path");
const otpService = require("../services/otpService");
const Otp = require("../models/Otp");

const SECRET_KEY = process.env.JWT_SECRET || "123";

exports.login = async (req, res) => {
  try {
    const { email, password, roleType } = req.body;
    const user = await User.findOne({ email, roleType });

    if (!user)
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "User not found or invaliad role",
      });

    if (user.roleType === "restro-owner" && user.restroOwnerStatus !== 1) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Your account is not yet approved by admin",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, email: user.email, roleType: user.roleType },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      resultCode: 0,
      resultData: {
        user: { roleType: user.roleType, email: user.email, userId: user._id },
        token: token,
      },
      resultMessage: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ resultCode: 1, resultMessage: "Error during login process" });
  }
};

exports.registerCustomer = async (req, res) => {
  try {
    const { firstName, lastName, mobileNo, email, address, password } =
      req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      mobileNo,
      email,
      address,
      password: hashedPassword,
      roleType: "customer",
    });

    res.status(201).json({
      resultCode: 0,
      resultData: newUser._id,
      resultMessage: "Customer registered successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({ resultCode: 1, resultMessage: "Error registering new customer" });
  }
};

exports.registerRestaurantOwner = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      mobileNo,
      restaurantName,
      address,
      password,
    } = req.body;
    console.log("Received request body:", req.body);
    console.log("Uploaded files:", req.files);

    // Ensure appLogo and document fields are available
    if (!req.files["appLogo"] || !req.files["document"]) {
      return res.status(400).json({
        resultCode: 1,
        resultData: {},
        resultMessage: "Both appLogo and document are required.",
      });
    }

    const existingRestroOwner = await User.findOne({
      $or: [{ email }, { mobileNo }, { restaurantName }],
    });
    console.log(existingRestroOwner);

    if (existingRestroOwner) {
      let message = "";

      if (existingRestroOwner.email === email)
        message += "Email already exists.";
      else if (existingRestroOwner.mobileNo === mobileNo)
        message += "Mobile number already exists. ";
      else if (existingRestroOwner.restaurantName === restaurantName)
        message += "Restaurant name already exists.";

      return res.status(409).json({
        resultCode: 1,
        resultData: {},
        resultMessage: message,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const registrationTime = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    // Create proper file paths with forward slashes
    // const sanitizedRestaurantName = restaurantName.replace(/[^\w\s]/gi, "_");

    const appLogoPath = `uploads/restaurant-owners/${req.files["appLogo"][0].filename}`;
    const documentPath = `uploads/restaurant-owners/${req.files["document"][0].filename}`;

    const newOwner = {
      firstName,
      lastName,
      email,
      mobileNo,
      restaurantName,
      address,
      password: hashedPassword,
      appLogo: appLogoPath.replace(/\\/g, "/"), // Correct file path format
      document: documentPath.replace(/\\/g, "/"), // Correct file path format
      roleType: "restro-owner",
      restroOwnerStatus: 0,
      registrationTime,
    };

    const result = await User.create(newOwner);
    res.status(201).json({
      resultCode: 0,
      resultData: result.insertedId,
      resultMessage: "Restaurant Owner registered successfully",
    });
  } catch (error) {
    console.error("Error inserting Restaurant Owner data:", error);
    res.status(500).json({
      resultCode: 1,
      resultData: {},
      resultMessage: "Error registering new Restaurant Owner",
    });
  }
};

exports.registerAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      return res.status(409).json({ message: "admin already exists!" });
    }

    const newAdmin = {
      email,
      password: hashedPassword,
      roleType: "admin",
    };

    const result = await User.create(newAdmin);
    res.status(200).json({
      resultCode: 0,
      resultMessage: "Admin Registered Successfully",
      // user: result.insertedId,
    });
  } catch (error) {
    console.error("Error inserting admin data: ", error);
    res
      .status(500)
      .json({ resultCode: 1, resultMessage: "Error registering new admin" });
  }
};

exports.logout = async (req, res) => {
  try {
  } catch (error) {
    console.log("Error in logout :", error);
    return res.status(400).json({
      resultCode: 1,
      resultMessage: error,
    });
  }
};

exports.requestEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Email is required",
      });
    }
    const existingVerifiedUser = await User.findOne({
      email,
      isVerified: true,
    });

    if (existingVerifiedUser) {
      return res.status(409).json({
        resultCode: 1,
        resultMessage: "Email already verified",
      });
    }

    await otpService.sendOtpEmail(email);
    return res.status(200).json({
      resultCode: 0,
      resultMessage: "OTP sent successfully. Please check your email.",
    });
  } catch (error) {
    return res.status(500).json({
      resultCode: 1,
      resultMessage: `Failed  to send OTP :${error.message || error}`,
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Email and OTP are required",
      });
    }

    const result = await otpService.verifyOtp(email, otp);
    if (!result.success) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: result.message,
      });
    }

    const user = await User.findOne({ email, isVerified: false });
    if (user) {
      user.isVerified = true;
      user.verifiedAt = new Date();
      await user.save();
    }
    return res.status(200).json({
      resultCode: 0,
      resultMessage: "Email verified successfully",
    });
  } catch (error) {
    return res.status(500).json({
      resultCode: 1,
      resultMessage: `Failed to verify OTP :${error.message || error}`,
    });
  }
};
