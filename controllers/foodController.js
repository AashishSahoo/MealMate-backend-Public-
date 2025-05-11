const Food = require("../models/Food");
const User = require("../models/User"); // Import the User model
const path = require("path");

exports.addItem = async (req, res) => {
  try {
    const { name, description, price, category, email } = req.body;

    if (!req.files || !req.files["image"] || req.files["image"].length === 0) {
      return res
        .status(400)
        .json({ resultCode: 1, resultMessage: "Image is required." });
    }

    if (!name || !description || !price || !category || !email) {
      return res
        .status(400)
        .json({ resultCode: 1, resultMessage: "All fields are required!" });
    }

    const restaurant = await User.findOne({ email });

    if (!restaurant) {
      return res
        .status(404)
        .json({ resultCode: 1, resultMessage: "Restaurant owner not found!" });
    }

    const restaurantId = restaurant._id;
    const imagePath = `uploads/food-items/${req.files["image"][0].filename}`;

    const newFood = new Food({
      name,
      description,
      price,
      category,
      restaurantId,
      image: imagePath,
    });

    await newFood.save();

    res.status(201).json({
      resultCode: 0,
      resultData: newFood,
      resultMessage: "Food item added successfully!",
    });
  } catch (error) {
    console.error("Error adding food item:", error);
    res.status(500).json({ resultMessage: "Error adding food item" });
  }
};

exports.getItem = async (req, res) => {
  try {
    const foodItems = await Food.find()
      .populate("category") // Populate category
      .populate({
        path: "restaurantId", // Correct path
        select: "restaurantName", // Select only restaurantName
      });

    // Process food items to include restaurantName and full image URL
    const processedFoodItems = foodItems.map((item) => ({
      ...item._doc,
      restaurantName: item.restaurantId?.restaurantName || "Unknown", // Add restaurantName
      imageUrl: `http://localhost:4000/${item.image}`, // Construct full image URL
    }));

    res.status(200).json({
      resultCode: 0,
      resultData: processedFoodItems,
      resultMessage: "Food details fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching food items:", error);
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Error fetching food items",
    });
  }
};

exports.getItemOwnerSpecific = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Email is required",
      });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "User not found",
      });
    }

    // Find food items by restaurantId (user._id)
    const foodItems = await Food.find({ restaurantId: user._id })
      .populate("category")
      .populate({
        path: "restaurantId",
        select: "restaurantName",
      });

    const processedFoodItems = foodItems.map((item) => ({
      ...item._doc,
      restaurantName: item.restaurantId?.restaurantName || "Unknown",
      imageUrl: `http://localhost:4000/${item.image}`,
    }));

    res.status(200).json({
      resultCode: 0,
      resultData: processedFoodItems,
      resultMessage: "Food details fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching food items:", error);
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Error fetching food items",
    });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleteFoodItem = await Food.findByIdAndDelete(id);

    if (!deleteFoodItem) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Food item not found!",
      });
    }
    res.status(200).json({
      resultCode: 0,
      resultMessage: "Food item deleted successfully!",
    });
  } catch (error) {
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Error deleting food item",
    });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;

    const { name, description, price, category, email, available } = req.body; // Include `available` in request body

    console.log(id, "id");
    console.log(email, "email");

    // Find the food item
    const foodItem = await Food.findById(id);
    if (!foodItem) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Food item not found!",
      });
    }

    // Fetch restaurantId using email
    const restaurant = await User.findOne({ email });
    if (!restaurant) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Restaurant owner not found!",
      });
    }
    const restaurantId = restaurant._id;

    // Ensure the food item belongs to the correct restaurant
    if (!foodItem.restaurantId.equals(restaurantId)) {
      return res.status(403).json({
        resultCode: 1,
        resultMessage: "You are not authorized to update this food item!",
      });
    }

    // Update fields if provided
    if (name) foodItem.name = name;
    if (description) foodItem.description = description;
    if (price) foodItem.price = price;
    if (category) foodItem.category = category;
    if (available !== undefined) foodItem.available = available;

    // Handle image upload if a new image is provided
    if (req.files && req.files["image"] && req.files["image"].length > 0) {
      foodItem.image = `uploads/food-items/${req.files["image"][0].filename}`;
    }

    await foodItem.save();

    res.status(200).json({
      resultCode: 0,
      resultData: foodItem,
      resultMessage: "Food item updated successfully!",
    });
  } catch (error) {
    console.error("Error updating food item:", error);
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Error updating food item",
    });
  }
};

exports.getRandomFood = async (req, res) => {
  try {
    const foods = await Food.aggregate([
      { $match: { available: true } },
      { $sample: { size: 7 } },
    ]);

    const foodsWithImageUrl = foods.map((food) => ({
      ...food,
      imageUrl: food.image ? `http://localhost:4000/${food.image}` : null,
    }));

    res.status(200).json({
      resultCode: 0,
      resultMessage: "Random food items fetched successfully",
      resultData: foodsWithImageUrl,
    });
  } catch (error) {
    console.error("Error generating random food items:", error);
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Error generating random food items",
    });
  }
};
