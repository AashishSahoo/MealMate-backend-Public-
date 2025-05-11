const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { verifyToken } = require("../middleware/auth");

// Routes for category management
router.post("/create", verifyToken, categoryController.createCategory);
router.get("/", verifyToken, categoryController.getCategories);
router.delete("/:id", verifyToken, categoryController.deleteCategory);

module.exports = router;
