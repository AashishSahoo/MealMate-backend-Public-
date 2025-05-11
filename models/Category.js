const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true }, // Unique category name
  description: String,
  createdAt: { type: Date, default: Date.now },
});


// Middleware to handle category deletion
CategorySchema.pre("findOneAndDelete", async function (next) {
  const categoryId = this.getQuery()._id;
  const uncategorized = await mongoose
    .model("Category")
    .findOne({ name: "Uncategorized" });

  if (!uncategorized) {
    // Create "Uncategorized" if it doesn't exist
    const newCategory = await mongoose
      .model("Category")
      .create({ name: "Uncategorized", description: "Default category" });
    await mongoose
      .model("Food")
      .updateMany({ category: categoryId }, { category: newCategory._id });
  } else {
    // Move food items to "Uncategorized"
    await mongoose
      .model("Food")
      .updateMany({ category: categoryId }, { category: uncategorized._id });
  }

  next();
});

module.exports = mongoose.model("Category", CategorySchema);
