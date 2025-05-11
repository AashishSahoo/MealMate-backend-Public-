const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      food: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Food",
        required: true,
      },
      quantity: Number,
      price: Number,
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "cancelled"],
    default: "pending",
  },
  deliveryAddress: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", OrderSchema);
