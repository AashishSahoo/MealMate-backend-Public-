const User = require("../models/User");
const Order = require("../models/Order");
const Food = require("../models/Food");

exports.monthlyProductReports = async (req, res) => {
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
      .sort((a, b) => b.sales - a.sales);

    return res.status(200).json({
      resultCode: 0,
      resultData: {
        categorySalesArray,
      },
      resultMessage: "Monthly products  report fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      resultCode: 1,
      resultMessage: error.message,
    });
  }
};
