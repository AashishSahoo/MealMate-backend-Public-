const Otp = require("../models/Otp");
const nodemailer = require("nodemailer");

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via email
exports.sendOtpEmail = async (email) => {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

  // Remove any existing OTPs for this email
  await Otp.deleteMany({ email });

  // Save new OTP
  await Otp.create({ email, otp, expiresAt });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Email Verification OTP",
    html: `
      <p>Your OTP for MealMate registration is:</p>
      <h2>${otp}</h2>
      <p>This OTP will expire in 5 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
  return { success: true };
};

// Verify OTP
exports.verifyOtp = async (email, enteredOtp) => {
  const record = await Otp.findOne({ email });

  if (!record) return { success: false, message: "OTP not found." };

  if (record.expiresAt < new Date()) {
    await Otp.deleteOne({ email });
    return { success: false, message: "OTP expired." };
  }

  if (record.otp !== enteredOtp)
    return { success: false, message: "Invalid OTP." };

  await Otp.deleteOne({ email }); // Clean up on success
  return { success: true };
};

// 0 → Success

// 1 → Missing email or OTP

// 2 → OTP not found

// 3 → OTP expired

// 4 → Invalid OTP

// 5 → Server error
