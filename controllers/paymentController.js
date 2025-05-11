// controllers/payment.js
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    console.log("Creating order with data:");
    // 1. Create Main Order First
    const order = new Order({
      user: req.body.user,
      restaurant: req.body.restaurant,
      items: req.body.items,
      totalAmount: req.body.totalAmount,
      deliveryAddress: req.body.deliveryAddress,
    });
    const savedOrder = await order.save();
    console.log("Creating order with data 1:");

    // 2. Create Razorpay Order
    const razorpayOrder = await razorpayInstance.orders.create({
      amount: Math.round(savedOrder.totalAmount * 100),

      currency: "INR",
      receipt: `order_${savedOrder._id}`,
    });
    console.log("Creating order with data2:");

    // 3. Create Payment Record with Initial State
    const payment = new Payment({
      order: savedOrder._id,
      razorpay_order_id: razorpayOrder.id,
      razorpay_payment_id: "pending", // Temporary value
      razorpay_signature: "pending", // Temporary value
      amount: savedOrder.totalAmount,
      status: "created",
    });
    console.log("Creating order with data3:");

    await payment.save();
    console.log("Creating order with data4:");

    res.status(201).json({
      resultCode: 0,
      resultData: {
        order: savedOrder,
        razorpayOrder,
        payment,
      },
    });
  } catch (error) {
    res.status(500).json({
      resultCode: 1,
      resultMessage: error.message,
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      req.body;

    // 1. Verify Signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Invalid signature",
      });
    }

    // 2. Update Payment Record
    const updatedPayment = await Payment.findOneAndUpdate(
      { razorpay_order_id },
      {
        razorpay_payment_id,
        razorpay_signature,
        status: "paid",
      },
      { new: true, runValidators: true }
    ).populate({
      path: "order",
      populate: [
        {
          path: "user",
          select: "firstName lastName email mobileNo address",
        },
        {
          path: "restaurant",
          select: "restaurantName email mobileNo address",
        },
        {
          path: "items.food",
          select: "name price description",
        },
      ],
    });

    // 3. Update Order Status
    await Order.findByIdAndUpdate(updatedPayment.order._id, {
      status: "processing",
    });

    // Updated Response with user address and timestamp
    const simplifiedResponse = {
      payment: {
        _id: updatedPayment._id,
        amount: updatedPayment.amount,
        currency: "INR",
        status: updatedPayment.status,
        razorpay: {
          order_id: updatedPayment.razorpay_order_id,
          payment_id: updatedPayment.razorpay_payment_id,
          signature: updatedPayment.razorpay_signature,
        },
        timestamp: updatedPayment.timestamp, // <-- Added timestamp
        createdAt: updatedPayment.createdAt,
      },
      order: {
        _id: updatedPayment.order._id,
        user: {
          name: `${updatedPayment.order.user.firstName} ${updatedPayment.order.user.lastName}`,
          contact: updatedPayment.order.user.mobileNo,
          email: updatedPayment.order.user.email,
          address: updatedPayment.order.user.address, // <-- Added user address
        },
        restaurant: {
          name: updatedPayment.order.restaurant.restaurantName,
          contact: updatedPayment.order.restaurant.mobileNo,
          address: updatedPayment.order.restaurant.address,
        },
        items: updatedPayment.order.items.map((item) => ({
          food: {
            name: item.food.name,
            price: item.food.price,
            description: item.food.description,
          },
          quantity: item.quantity,
        })),
        totalAmount: updatedPayment.order.totalAmount,
        status: "processing",
        deliveryAddress: updatedPayment.order.deliveryAddress,
        createdAt: updatedPayment.order.createdAt,
      },
    };

    res.json({
      resultCode: 0,
      resultData: simplifiedResponse,
    });
  } catch (error) {
    try {
      const failedPayment = await Payment.findOneAndUpdate(
        { razorpay_order_id },
        {
          razorpay_payment_id,
          razorpay_signature,
          status: "failed",
        }
      );

      if (failedPayment) {
        await Order.findByIdAndUpdate(failedPayment.order, {
          status: "cancelled",
        });
      }
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError.message);
    }

    res.status(500).json({
      resultCode: 1,
      resultMessage: error.message || "Payment verification failed",
    });
  }
};
