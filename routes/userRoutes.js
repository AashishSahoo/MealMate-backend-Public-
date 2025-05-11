const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken } = require("../middleware/auth");

// router.get("/", verifyToken, userController.getAllUsers);

router.get("/customers", verifyToken, userController.getAllUsers);

router.get(
  "/restaurant-owners",
  verifyToken,
  userController.getAllRestroOwners
);

// router.put(
//   "/restaurant-owners/:id/status",
//   verifyToken,
//   userController.updateRestroOwnerStatus
// );

router.delete(
  "/delete-restaurant-owners/:id",
  verifyToken,
  userController.deleteRestroOwner
);

router.delete(
  "/delete-customer/:id",
  verifyToken,
  userController.deleteCustomer
);

router.get(
  "/restro-owners-list",
  verifyToken,
  userController.getRestroOwnerList
);

router.get("/user-profile/:email", verifyToken, userController.getUserProfile);

module.exports = router;
