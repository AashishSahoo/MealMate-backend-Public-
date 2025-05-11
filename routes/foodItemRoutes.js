const express = require("express");
const router = express.Router();
const foodController = require("../controllers/foodController");
const { verifyToken } = require("../middleware/auth");
const { upload } = require("../middleware/uploadFoodCheck");

router.post(
  "/addItem",
  verifyToken,
  upload.fields([{ name: "image" }]), // Handles multiple files
  foodController.addItem
);

router.get("/get", verifyToken, foodController.getItemOwnerSpecific);
router.get("/getAllFoods", verifyToken, foodController.getItem);

router.delete("/deleteItem/:id", verifyToken, foodController.deleteItem);

router.put(
  "/updateItem/:id",
  verifyToken,
  upload.fields([{ name: "image" }]),
  foodController.updateItem
);

router.get("/random", verifyToken, foodController.getRandomFood);

module.exports = router;
