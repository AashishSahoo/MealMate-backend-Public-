const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      foodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Food",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      category: {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
        name: String,
      },
      image: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
        min: 1,
      },
      itemTotal: {
        type: Number,
        default: function () {
          return this.price * this.quantity;
        },
      },
    },
  ],
  grandTotal: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to calculate totals
CartSchema.pre("save", function (next) {
  // Calculate item totals
  this.items.forEach((item) => {
    item.itemTotal = item.price * item.quantity;
  });

  // Calculate grand total
  this.grandTotal = this.items.reduce((sum, item) => sum + item.itemTotal, 0);

  // Update timestamp
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Cart", CartSchema);
