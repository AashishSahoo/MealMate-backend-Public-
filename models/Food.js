const mongoose = require("mongoose");

const FoodSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Ensure this matches the User model name
    required: true,
  },
  name: String,
  description: String,
  price: Number,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category", // Ensure this matches the Category model name
    required: true,
  },
  image: String,
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Food", FoodSchema);
