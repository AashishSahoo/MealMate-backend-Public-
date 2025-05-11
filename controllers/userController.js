const User = require("../models/User");
const path = require("path"); // Add missing import
const mongoose = require("mongoose"); // Add this line at the top

exports.getAllUsers = async (req, res) => {
  try {
    // Replace native MongoDB driver with Mongoose
    const users = await User.find({ roleType: "customer" });
    res.status(200).json({
      resultCode: 0,
      resultData: users,
      resultMessage: "Fetched all users successfully",
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ resultMessage: "Error fetching users" });
  }
};

exports.getAllRestroOwners = async (req, res) => {
  try {
    // Use Mongoose instead of native driver
    const restroOwners = await User.find({ roleType: "restro-owner" });

    const processedOwners = restroOwners.map((owner) => ({
      ...owner._doc,
      appLogoUrl: `http://localhost:4000/${owner.appLogo}`,
      documentUrl: `http://localhost:4000/${owner.document}`,
      password: undefined,
    }));

    res.status(200).json({
      resultCode: 0,
      resultMessage: "Restaurant owners list fetched successfully",
      resultData: processedOwners,
    });
  } catch (error) {
    console.error("Error fetching restaurant owners:", error);
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Error fetching restaurant owners",
    });
  }
};

exports.getRestroOwnerList = async (req, res) => {
  try {
    // Fetch restaurant owners with only _id and restaurantName
    const restroOwners = await User.find(
      { roleType: "restro-owner" },
      { _id: 1, restaurantName: 1 } // Include only _id and restaurantName
    );

    res.status(200).json({
      resultCode: 0,
      resultMessage: "Restaurant owners list fetched successfully",
      resultData: restroOwners,
    });
  } catch (error) {
    console.error("Error fetching restaurant owners list:", error);
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Error fetching restaurant owners list",
    });
  }
};

exports.deleteRestroOwner = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Invalid ID format",
      });
    }

    const deletedOwner = await User.findOneAndDelete({
      _id: id,
      roleType: "restro-owner",
    });

    if (!deletedOwner) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Restaurant owner not found",
      });
    }

    res.status(200).json({
      resultCode: 0,
      resultMessage: "Restaurant owner deleted successfully",
      resultData: deletedOwner,
    });
  } catch (error) {
    console.error("Error deleting restaurant owner:", error);
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Error deleting restaurant owner",
    });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Invalid ID format",
      });
    }

    const deletedCustomer = await User.findOneAndDelete({
      _id: id,
      roleType: "customer",
    });

    if (!deletedCustomer) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "customer not found",
      });
    }

    res.status(200).json({
      resultCode: 0,
      resultMessage: "Restaurant owner deleted successfully",
      resultData: deletedCustomer,
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Error deleting customer",
    });
  }
};

exports.getUserProfile = async (req, res) => {
  console.log("its a hit");
  try {
    const emailId = req.params.email;

    if (!emailId) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Email is required",
      });
    }

    const user = await User.findOne({ email: emailId }).select("-password");
    if (!user) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "User not found",
      });
    }

    const userDetails = {
      ...user._doc,
      appLogoUrl: user.appLogo ? `http://localhost:4000/${user.appLogo}` : null,
      documentUrl: user.document
        ? `http://localhost:4000/${user.document}`
        : null,
    };

    res.status(200).json({
      resultCode: 0,
      resultData: userDetails,
      resultMessage: "User Profile details fetched successfully",
    });
  } catch (error) {
    console.log("Error fetching profile details for user:", error);
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Internal server error",
    });
  }
};
