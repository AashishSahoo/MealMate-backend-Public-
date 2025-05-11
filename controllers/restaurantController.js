const User = require("../models/User");
const {
  sendApprovalEmail,
  sendRejectionEmail,
} = require("../utils/emailService");

exports.declineRestroOwner = async (req, res) => {
  try {
    const { feedback } = req.body;
    const ownerId = req.params.id;

    if (!feedback) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Feedback is required for rejection",
        resultData: [],
      });
    }

    const owner = await User.findOneAndUpdate(
      { _id: ownerId, roleType: "restro-owner" },
      { restroOwnerStatus: -1, updateStatusTime: Date.now() },
      { new: true }
    );

    if (!owner) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Restaurant owner not found",
        resultData: [],
      });
    }

    await sendRejectionEmail(
      owner.email,
      owner.firstName,
      owner.lastName,
      owner.restaurantName,
      feedback
    );

    res.status(200).json({
      resultCode: 0,
      resultMessage: "Restaurant owner declined successfully",
      resultData: owner,
    });
  } catch (error) {
    console.error("Error declining restaurant owner:", error);
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Error declining restaurant owner",
      resultData: [],
    });
  }
};

exports.approveRestroOwner = async (req, res) => {
  try {
    const ownerId = req.params.id;

    const owner = await User.findOneAndUpdate(
      { _id: ownerId, roleType: "restro-owner" },
      { restroOwnerStatus: 1, updateStatusTime: Date.now() },

      { new: true }
    );

    if (!owner) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Restaurant owner not found",
        resultData: [],
      });
    }

    await sendApprovalEmail(
      owner.email,
      owner.firstName,
      owner.lastName,
      owner.restaurantName
    );

    res.status(200).json({
      resultCode: 0,
      resultMessage: "Restaurant owner approved successfully",
      resultData: owner,
    });
  } catch (error) {
    console.error("Error approving restaurant owner:", error);
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Error approving restaurant owner",
      resultData: [],
    });
  }
};
