const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true, required: true },
  mobileNo: String,
  address: String,
  password: { type: String, required: true },
  roleType: {
    type: String,
    enum: ["admin", "restro-owner", "customer"],
    required: true,
  },
  restaurantName: {
    type: String,
    required: function () {
      return this.roleType === "restro-owner";
    },
  },
  appLogo: String,
  document: String,
  restroOwnerStatus: {
    type: Number,
    enum: [-1, 0, 1],
    default: function () {
      return this.roleType === "restro-owner" ? 0 : null;
    },
  },
  registrationTime: { type: Date, default: Date.now },
  updateStatusTime: { type: Date },
  isVerified: {
    type: Boolean,
    default: function () {
      return this.roleType === "admin" ? true : false;
    },
  },
  verifiedAt: { type: Date },
});

module.exports = mongoose.model("User", UserSchema);
