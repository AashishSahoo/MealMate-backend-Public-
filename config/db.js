const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.REACT_DB_CONNECT, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;

const nodemailer = require("nodemailer");

exports.transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
