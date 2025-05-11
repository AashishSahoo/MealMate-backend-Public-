const express = require("express");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

const orderController = require("../controllers/orderController");

router.get(
  `/getAllOrdersByUser/:email`,
  verifyToken,
  orderController.getAllOrdersByUser
);

router.get(
  `/getAllIncomingOrdersByRestaurant/:email`,
  verifyToken,
  orderController.getAllIncomingOrdersByRestaurant
);

router.get(
  `/getAllOrdersByRestaurant/:email`,
  verifyToken,
  orderController.getAllOrdersByRestaurant
);

router.patch(
  "/:orderId/complete",
  verifyToken,
  orderController.markOrderAsCompleted
);

router.patch(
  "/:orderId/cancelled",
  verifyToken,
  orderController.markOrderAsCancelled
);

router.get("/dashboardStat/:email", verifyToken, orderController.dashboardStat);

router.get("/getAllOrders", verifyToken, orderController.getAllOrders);

router.get(
  "/dashboard-overview",
  verifyToken,
  orderController.getAdminDashboardOverview
);

router.get("/day-wise", verifyToken, orderController.getOrderByDay);
router.get(
  "/user-dashboard/:email",
  verifyToken,
  orderController.userDashboard
);

module.exports = router;
