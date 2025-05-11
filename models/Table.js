const mongoose = require("mongoose");

const TableSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bookingCharges: { type: Number, required: true },
  tableNumber: { type: String, required: true },
  capacity: { type: String, required: true },
  timeslot: { type: String, required: true },
  bookingDate: { type: Date, required: true }, // Add date field
  status: {
    type: String,
    enum: ["available", "booked", "expired"], // Add expired status
    default: "available",
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  bookedAt: { type: Date, default: null },
});

// Add compound index to prevent duplicate bookings
TableSchema.index(
  { restaurantId: 1, tableNumber: 1, bookingDate: 1, timeslot: 1 },
  { unique: true }
);

module.exports = mongoose.model("Table", TableSchema);
