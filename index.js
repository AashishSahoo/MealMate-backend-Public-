require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const Table = require("./models/Table");

// Route imports
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
// const restaurantRoutes = require("./routes/restaurantRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database connection
connectDB();
const categoryRoutes = require("./routes/categoryRoutes");
const foodItemRoutes = require("./routes/foodItemRoutes");
const tablesRoutes = require("./routes/tableRoutes");
const cartRoutes = require("./routes/cartRoutes");
const paymentRoutes = require("./routes/paymentRoute");
const ChatBotRoutes = require("./routes/chatbotRoutes");

const restroOwnerStatusRoute = require("./routes/restaurantRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reportRoutes = require("./routes/reportRoutes");

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/categories", categoryRoutes);
app.use("/tables", tablesRoutes);
app.use("/food", foodItemRoutes);
app.use("/cart", cartRoutes);

app.use("/restaurantStatus", restroOwnerStatusRoute);
app.use("/payments", paymentRoutes);
app.use("/orders", orderRoutes);
app.use("/report", reportRoutes);
app.use("/chatbot", ChatBotRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
