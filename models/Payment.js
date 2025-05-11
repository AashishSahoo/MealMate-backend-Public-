const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  razorpay_order_id: {
    type: String,
    required: true,
  },
  razorpay_payment_id: {
    type: String,
    required: true,
  },
  razorpay_signature: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["created", "attempted", "paid", "failed"],
    default: "created",
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "INR",
  },
  method: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Payment", PaymentSchema);
