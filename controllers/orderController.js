
const User = require("../models/User");
const Order = require("../models/Order");
const Food = require("../models/Food");

const mongoose = require("mongoose");

exports.getAllOrdersByUser = async (req, res) => {
  try {
    // k
    const email = req.params.email;

    if (!email) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "User not found",
      });
    }

    let orders = await Order.find({ user: user._id })
      .populate("restaurant", "restaurantName email")
      .populate("items.food", "name price image")
      .populate("user", "address firstName lastName")
      .lean(); // 🧠 Important: use .lean() so you can modify the result easily

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "No order history found",
      });
    }

    // 🔥 Process the image URL for each order
    orders = orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        food: {
          ...item.food,
          imageUrl: item.food?.image
            ? `http://localhost:4000/${item.food.image}`
            : null,
        },
      })),
    }));

    return res.status(200).json({
      resultCode: 0,
      resultData: orders,
    });
  } catch (error) {
    return res.status(500).json({
      resultCode: 1,
      resultMessage: error.message,
    });
  }
};

exports.getAllIncomingOrdersByRestaurant = async (req, res) => {
  try {
    const email = req.params.email;

    if (!email) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Email is required",
      });
    }

    // Step 1: Find restaurant owner by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Restaurant owner not found",
      });
    }

    // Step 2: Find orders for this restaurant with 'processing' status
    const orders = await Order.find({
      restaurant: user._id,
      status: "processing",
    })
      .populate("restaurant", "restaurantName email")
      .populate("items.food", "name price image")
      .populate("user", "address firstName lastName");

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "No processing orders found for this restaurant",
      });
    }

    return res.status(200).json({
      resultCode: 0,
      resultData: orders,
    });
  } catch (error) {
    return res.status(500).json({
      resultCode: 1,
      resultMessage: error.message,
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ["completed", "cancelled", "processing"] },
    })
      .populate("items.food", "name price image")

      .populate("restaurant", "restaurantName  email")
      .populate("user", "firstName lastName email ");

    if (!orders || orders.length === 0) {
      return res.status(200).json({
        resultCode: 1,
        resultData: [],

        resultMessage: "No orders found",
      });
    }
    return res.status(200).json({
      resultCode: 0,
      resultData: orders,
      resultMessage: "ALl Orders Fetched Successfully",
    });
  } catch (error) {
    console.log("Error fetching all orders for admin :", error);
    return res.status(500).json({
      resultCode: 1,
      resultMessage: error.message,
    });
  }
};

exports.getAllOrdersByRestaurant = async (req, res) => {
  try {
    const email = req.params.email;

    if (!email) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Email is required",
      });
    }

    // Step 1: Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "User not found",
      });
    }

    // Step 2: Filter orders with 'processing' status
    const orders = await Order.find({
      restaurant: user._id,
      status: { $in: ["completed", "cancelled"] },
    })
      .populate("restaurant", "restaurantName email")
      .populate("items.food", "name price image")
      .populate("user", "address firstName lastName");

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "No orders found",
      });
    }

    return res.status(200).json({
      resultCode: 0,
      resultData: orders,
    });
  } catch (error) {
    return res.status(500).json({
      resultCode: 1,
      resultMessage: error.message,
    });
  }
};

exports.markOrderAsCompleted = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    if (!orderId) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Order ID is required",
      });
    }

    // Step 1: Find the order first
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Order not found",
      });
    }

    // Step 2: Check if already completed
    if (order.status === "completed") {
      return res.status(200).json({
        resultCode: 0,
        resultMessage: "Order already completed",
        resultData: order,
      });
    }

    // Step 3: Update the status to completed
    order.status = "completed";
    const updatedOrder = await order.save();

    return res.status(200).json({
      resultCode: 0,
      resultMessage: "Order marked as completed",
      resultData: updatedOrder,
    });
  } catch (error) {
    return res.status(500).json({
      resultCode: 1,
      resultMessage: error.message,
    });
  }
};

exports.markOrderAsCancelled = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    if (!orderId) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Order ID is required",
      });
    }

    // Step 1: Find the order first
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Order not found",
      });
    }

    // Step 2: Check if already completed
    if (order.status === "cancelled") {
      return res.status(200).json({
        resultCode: 0,
        resultMessage: "Order already cancelled",
        resultData: order,
      });
    }

    // Step 3: Update the status to completed
    order.status = "cancelled";
    const updatedOrder = await order.save();

    return res.status(200).json({
      resultCode: 0,
      resultMessage: "Order marked as cancelled",
      resultData: updatedOrder,
    });
  } catch (error) {
    return res.status(500).json({
      resultCode: 1,
      resultMessage: error.message,
    });
  }
};

exports.dashboardStat = async (req, res) => {
  try {
    const email = req.params.email;

    if (!email) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Email is required",
      });
    }

    const restaurant = await User.findOne({ email, roleType: "restro-owner" });
    if (!restaurant) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Restaurant owner not found",
      });
    }

    const restaurantId = restaurant._id;

    const orders = await Order.find({ restaurant: restaurantId });
    const completedOrders = orders.filter(
      (order) => order.status === "completed"
    );

    const totalOrders = orders.length;
    const totalRevenue = completedOrders.reduce(
      (acc, order) => acc + order.totalAmount,
      0
    );
    const pendingOrders = orders.filter(
      (order) => order.status === "processing"
    ).length;
    const acceptedOrders = completedOrders.length;
    const rejectedOrders = orders.filter(
      (order) => order.status === "cancelled"
    ).length;

    const foodItems = await Food.find({ restaurantId }).populate("category");

    const categorySalesMap = {};

    for (const food of foodItems) {
      const categoryName = food.category?.name || "Uncategorized";

      const foodOrders = completedOrders.filter((order) =>
        order.items.some((item) => item.food.toString() === food._id.toString())
      );

      let totalSales = 0;
      let latestOrderTime = null;

      for (const order of foodOrders) {
        for (const item of order.items) {
          if (item.food.toString() === food._id.toString()) {
            totalSales += item.price * item.quantity;

            // Set latestOrderTime if it's newer
            if (
              !latestOrderTime ||
              new Date(order.createdAt) > new Date(latestOrderTime)
            ) {
              latestOrderTime = order.createdAt;
            }
          }
        }
      }

      if (totalSales > 0) {
        if (categorySalesMap[categoryName]) {
          categorySalesMap[categoryName].sales += totalSales;
          if (
            new Date(latestOrderTime) >
            new Date(categorySalesMap[categoryName].latestTime)
          ) {
            categorySalesMap[categoryName].latestTime = latestOrderTime;
          }
        } else {
          categorySalesMap[categoryName] = {
            sales: totalSales,
            latestTime: latestOrderTime,
          };
        }
      }
    }

    const categorySalesArray = Object.entries(categorySalesMap)
      .map(([category, data]) => ({
        category,
        sales: data.sales,
        latestTime: data.latestTime,
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5); // Only top 5 best selling categories

    return res.status(200).json({
      resultCode: 0,
      resultData: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        acceptedOrders,
        rejectedOrders,
        salesByCategory: categorySalesArray,
      },
      resultMessage: "Dashboard stats fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      resultCode: 1,
      resultMessage: error.message,
    });
  }
};

exports.getAdminDashboardOverview = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // 1. Top 4 Selling Food Items
    const topSellingItems = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.food",
          totalSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "foods",
          localField: "_id",
          foreignField: "_id",
          as: "foodDetails",
        },
      },
      { $unwind: "$foodDetails" },
      {
        $project: {
          _id: 0,
          name: "$foodDetails.name",
          price: "$foodDetails.price",
          totalSold: 1,
        },
      },
    ]);

    // 2. Top 5 Restaurants with Best Sales Stats
    const topRestaurants = await Order.aggregate([
      {
        $group: {
          _id: "$restaurant",
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { totalOrders: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "restaurantDetails",
        },
      },
      { $unwind: "$restaurantDetails" },
      {
        $project: {
          _id: 0,
          restaurantName: "$restaurantDetails.restaurantName",
          totalOrders: 1,
        },
      },
    ]);

    // 3. Monthly Orders Overview (Current Year)
    const monthlyOrders = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    // Format month data (ensure all 12 months are present)
    const ordersPerMonth = Array(12).fill(0);
    monthlyOrders.forEach(({ _id, orderCount }) => {
      ordersPerMonth[_id - 1] = orderCount;
    });
    res.json({
      resultCode: 0,
      resultMessage: "Admin Dashboard stat fetched",
      resultData: {
        topSellingItems,
        topRestaurants,
        monthlyOrders: ordersPerMonth,
      },
    });
  } catch (error) {
    console.error("Dashboard Overview Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getOrderByDay = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // Use UTC for start/end of year
    const startOfYear = new Date(Date.UTC(currentYear, 0, 1)); // Jan 1 UTC
    const endOfYear = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59)); // Dec 31 UTC

    const orderData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const orderMap = {};
    orderData.forEach((entry) => {
      orderMap[entry._id] = entry.count;
    });

    const days = [];
    let currentDate = new Date(startOfYear);

    // Generate all days in UTC
    while (currentDate <= endOfYear) {
      const year = currentDate.getUTCFullYear();
      const month = String(currentDate.getUTCMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getUTCDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      days.push({
        date: dateStr,
        count: orderMap[dateStr] || 0,
      });

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    res.status(200).json({
      resultCode: 0,
      resultData: days,
    });
  } catch (error) {
    res.status(500).json({ resultCode: 1 });
  }
};

exports.userDashboard = async (req, res) => {
  try {
    const email = req.params.email;

    if (!email) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Email is required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Customer not found with provided email",
      });
    }

    const userId = user._id; // Now you have userId

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch today's orders for this user
    const todaysOrders = await Order.find({
      user: userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["processing", "completed"] },
    });
    const todayOrderCount = todaysOrders.length;

    // Fetch latest order
    const latestOrder = await Order.findOne({
      user: userId,
      status: { $in: ["processing", "completed"] },
    })
      .sort({ createdAt: -1 }) // most recent first
      .populate("items.food"); // populate food details

    let currentOrderStatus = null;

    if (latestOrder) {
      currentOrderStatus = {
        status: latestOrder.status,
        deliveryTimeEstimate: "15 mins away", // static
        items: latestOrder.items.map((item) => ({
          foodName: item.food?.name || "Unknown Food",
          quantity: item.quantity,
          price: item.price,
        })),
      };
    }

    return res.status(200).json({
      resultCode: 0,
      resultMessage: "Customer dashboard data fetched successfully",
      resultData: {
        todayOrderCount,
        currentOrderStatus,
      },
    });
  } catch (error) {
    console.error("Error fetching customer dashboard data:", error);
    return res.status(500).json({
      resultCode: 1,
      resultMessage: "Error fetching customer dashboard data",
    });
  }
};
