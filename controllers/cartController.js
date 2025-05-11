const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Food = require("../models/Food");
const User = require("../models/User");

// @desc    Get user's cart with populated details
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Email parameter is required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "User not found",
      });
    }

    const userId = user._id;

    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: "restaurantId",
        select: "restaurantName appLogo",
      })
      .populate({
        // Add this new population
        path: "items.foodId",
        select: "image category",
      })
      .lean();

    if (!cart) {
      return res.status(200).json({
        resultCode: 0,
        resultData: {
          items: [],
          grandTotal: 0,
          restaurant: null,
        },
        resultMessage: "Empty cart",
      });
    }

    const processedItems = cart.items.map((item) => ({
      ...item,
      imageUrl: `http://localhost:4000/${item.foodId.image}`, // Now using populated image
      category: item.foodId.category.name, // Get category name from populated data
    }));

    res.json({
      resultCode: 0,
      resultData: {
        ...cart,
        items: processedItems,
        restaurant: {
          name: cart.restaurantId.restaurantName,
          logo: `http://localhost:4000/${cart.restaurantId.appLogo}`,
        },
      },
      resultMessage: "Cart retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Server error",
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
const addToCart = async (req, res) => {
  // console.log("cart");
  try {
    const { email, foodId, quantity = 1 } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "User not found",
      });
    }
    const userId = user._id;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(foodId)) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Invalid food ID",
      });
    }

    // Get food item with restaurant details
    const food = await Food.findById(foodId)
      .populate("category", "name")
      .populate("restaurantId", "restaurantName");

    if (!food || !food.available) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Food item not available",
      });
    }

    let cart = await Cart.findOne({ user: userId });

    // Cart creation logic
    if (!cart) {
      cart = new Cart({
        user: userId,
        restaurantId: food.restaurantId._id,
        items: [],
      });
    }
    // Check restaurant match
    else if (!cart.restaurantId.equals(food.restaurantId._id)) {
      return res.status(200).json({
        resultCode: 71,
        resultMessage:
          "Cannot add items from different restaurants. Clear cart first.",
      });
    }

    // Check existing item
    const existingIndex = cart.items.findIndex(
      (item) => item.foodId.toString() === foodId.toString()
    );

    if (existingIndex > -1) {
      // Update existing item
      cart.items[existingIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        foodId: food._id,
        name: food.name,
        image: food.image,
        price: food.price,
        quantity,
        image: food.image,

        category: {
          id: food.category._id,
          name: food.category.name,
        },
      });
    }

    await cart.save();

    res.status(200).json({
      resultCode: 0,
      resultData: cart,
      resultMessage: "Item added to cart",
    });
  } catch (error) {
    console.log(error, "cart error ");
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Server error",
    });
  }
};

// @desc    Update item quantity
// @route   PUT /api/cart/update/:foodId
// @access  Private
// const updateCartItem = async (req, res) => {
//   try {
//     const { foodId, userId } = req.query; // Changed from req.params to req.query
//     const { quantity } = req.body;
//     // const userId = req.user._id;

//     if (!quantity || quantity < 1 || quantity > 20) {
//       return res.status(400).json({
//         resultCode: 1,
//         resultMessage: "Invalid quantity",
//       });
//     }

//     const cart = await Cart.findOne({ user: userId });
//     if (!cart) {
//       return res.status(404).json({
//         resultCode: 1,
//         resultMessage: "Cart not found",
//       });
//     }

//     const itemIndex = cart.items.findIndex(
//       (item) => item.foodId.toString() === foodId.toString()
//     );

//     if (itemIndex === -1) {
//       return res.status(404).json({
//         resultCode: 1,
//         resultMessage: "Item not in cart",
//       });
//     }

//     cart.items[itemIndex].quantity = quantity;
//     await cart.save();

//     res.json({
//       resultCode: 0,
//       resultData: cart,
//       resultMessage: "Quantity updated",
//     });
//   } catch (error) {
//     res.status(500).json({
//       resultCode: 1,
//       resultMessage: "Server error",
//     });
//   }
// };

// Update Cart Item Controller
const updateCartItem = async (req, res) => {
  try {
    const { foodId, userId } = req.query;
    const { quantity } = req.body;

    if (!quantity || quantity < 1 || quantity > 10) {
      return res.status(200).json({
        resultCode: 71,
        resultMessage: "Quantity must be between 1 and 20",
      });
    }

    const cart = await Cart.findOneAndUpdate(
      {
        user: userId,
        "items.foodId": foodId,
      },
      { $set: { "items.$.quantity": quantity } },
      { new: true }
    );

    if (!cart) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Item not found in cart",
      });
    }

    // Recalculate totals
    cart.items.forEach((item) => {
      item.itemTotal = item.price * item.quantity;
    });
    cart.grandTotal = cart.items.reduce((sum, item) => sum + item.itemTotal, 0);
    await cart.save();

    res.json({
      resultCode: 0,
      resultData: cart,
      resultMessage: "Quantity updated",
    });
  } catch (error) {
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Server error",
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:foodId
// @access  Private

const removeCartItem = async (req, res) => {
  try {
    const { foodId, userId } = req.query; // Changed from req.params to req.query

    if (!foodId || !userId) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Both foodId and userId are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(foodId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res
        .status(400)
        .json({ resultCode: 1, resultMessage: "Invalid foodId or userId" });
    }

    const foodObjectId = new mongoose.Types.ObjectId(foodId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    console.log("Removing item:", foodObjectId, "for user:", userObjectId);

    // Find the cart and remove the item
    const cart = await Cart.findOneAndUpdate(
      { user: userObjectId, "items.foodId": foodObjectId },
      { $pull: { items: { foodId: foodObjectId } } },
      { new: true }
    );

    if (!cart) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Cart not found or item does not exist",
      });
    }

    // If cart is now empty, delete it
    if (cart.items.length === 0) {
      await Cart.deleteOne({ _id: cart._id });
      return res.json({
        resultCode: 0,
        resultData: null,
        resultMessage: "Cart emptied",
      });
    }

    res.json({
      resultCode: 0,
      resultData: cart,
      resultMessage: "Item removed",
    });
  } catch (error) {
    console.error("Error removing cart item:", error);
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Server error",
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
};
