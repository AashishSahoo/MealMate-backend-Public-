const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");
const { verifyToken } = require("../middleware/auth");

router.get("/data/:email", verifyToken, chatbotController.getDataForAI);
router.post("/ask", verifyToken, chatbotController.getAIResponse);

module.exports = router;
