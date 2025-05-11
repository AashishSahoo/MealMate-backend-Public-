const Category = require("../models/Category");
const Food = require("../models/Food");

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const existingCategory = await Category.findOne({ name });

    if (existingCategory) {
      return res
        .status(400)
        .json({ resultCode: -1, resultMessage: "Category already exists" });
    }

    const category = new Category({ name });
    await category.save();

    const allCategories = await Category.find();

    res.status(201).json({
      resultCode: 0,
      resultData: allCategories,
      resultMessage: "Category created successfully",
    });
  } catch (error) {
    res.status(500).json({ resultCode: 1, resultMessage: error.message });
  }
};

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({
      resultCode: 0,
      resultData: categories,
      resultMessage: "Category details fetched successfully",
    });
  } catch (error) {
    res.status(500).json({ resultCode: 1, resultMessage: error.message });
  }
};

// Delete a category (moves food items to "Uncategorized")
exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ resultCode: 1, resultMessage: "Category not found" });
    }

    if (category.name === "Uncategorized") {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Cannot delete default Uncategorized category",
      });
    }

    await Category.findOneAndDelete({ _id: categoryId });
    res.status(200).json({
      resultCode: 0,
      resultMessage: "Category deleted and food items reassigned",
    });
  } catch (error) {
    res.status(500).json({ resultCode: 1, resultMessage: error.message });
  }
};
