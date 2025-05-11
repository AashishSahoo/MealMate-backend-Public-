const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { verifyToken } = require("../middleware/auth");

router.post("/addToCart", verifyToken, cartController.addToCart);
router.post("/updateCartItem", verifyToken, cartController.updateCartItem);
router.delete("/removeCartItem", verifyToken, cartController.removeCartItem);
router.get("/getCart", verifyToken, cartController.getCart);

module.exports = router;
