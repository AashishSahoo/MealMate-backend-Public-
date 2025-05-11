const express = require("express");
const router = express.Router();
const tableController = require("../controllers/tableController");
const { verifyToken } = require("../middleware/auth");

// Table management
router.post("/addTable", verifyToken, tableController.addNewTable);
router.get(
  "/get-restaurant-tables",
  verifyToken,
  tableController.getRestaurantTables
);

router.get(
  "/get-all-bookings-restuarant/:id",
  verifyToken,
  tableController.getAllBookingsByRestuarant
);

router.get(
  "/get-restaurant-tables/history",
  verifyToken,
  tableController.getRestaurantTablesHistory
);

router.delete("/deleteTable/:id", verifyToken, tableController.deleteTable);
router.put("/updateTable/:id", verifyToken, tableController.updateTable);

// Booking system
router.get(
  "/get-available-tables",
  tableController.getAvailableTablesForCustomers
);
router.post("/book-table", verifyToken, tableController.bookTable);
router.get("/get-all-bookings", verifyToken, tableController.getAllBookings);

router.get(
  "/get-all-bookings-restuarant/:id",
  verifyToken,
  tableController.getAllBookingsByRestuarant
);

// Expire old bookings (cron endpoint)
router.post("/expire-old-bookings", tableController.expireOldBookings);

module.exports = router;
