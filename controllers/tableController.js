const Table = require("../models/Table");
const User = require("../models/User");
const mongoose = require("mongoose"); // Add this line at the top
const cron = require("node-cron");
const moment = require("moment"); // Optional, but good for date handling

exports.addNewTable = async (req, res) => {
  try {
    const {
      tableNumber,
      capacity,
      timeslot,
      status,
      bookingCharges,
      email,
      bookingDate,
    } = req.body;

    // Validate required fields
    if (
      !tableNumber ||
      !capacity ||
      !timeslot ||
      !status ||
      !bookingCharges ||
      !email ||
      !bookingDate
    ) {
      return res.status(400).json({
        resultCode: 1,
        resultData: {},
        resultMessage: "All fields are required.",
      });
    }

    const restaurant = await User.findOne({ email });
    if (!restaurant) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Restaurant owner not found!",
      });
    }
    const restaurantId = restaurant._id;

    const existingTable = await Table.findOne({
      restaurantId,
      tableNumber,
      timeslot,
    });
    if (existingTable) {
      return res.status(200).json({
        resultCode: 71,
        resultMessage:
          "Table with the same number and timeslot already exists!",
      });
    }

    // Create a new table document
    const newTable = new Table({
      tableNumber,
      capacity,
      timeslot,
      status,
      bookingCharges,
      restaurantId,
      bookingDate,
    });

    // Save the table
    await newTable.save();

    res.status(201).json({
      resultCode: 0,
      resultData: newTable,
      resultMessage: "Table added successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ resultMessage: "Error adding new table!" });
  }
};
exports.getRestaurantTables = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Email is required.",
      });
    }

    const restaurantOwner = await User.findOne({
      email,
      roleType: "restro-owner",
    });

    if (!restaurantOwner) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Restaurant owner not found!",
      });
    }

    const currentTime = new Date();

    await Table.deleteMany({
      restaurantId: restaurantOwner._id,
      bookingDate: { $lt: currentTime },
      status: { $in: ["available", "expired"] },
    });

    const restaurantTables = await Table.find({
      restaurantId: restaurantOwner._id,
      status: { $in: ["booked", "available"] },
      bookingDate: { $gte: new Date() },
    });

    res.status(200).json({
      resultCode: 0,
      resultData: restaurantTables,
      resultMessage: "Tables fetched successfully!",
    });
  } catch (error) {
    console.error("Error fetching tables:", error);
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Error fetching tables!",
    });
  }
};

exports.getRestaurantTablesHistory = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Email is required.",
      });
    }

    const restaurantOwner = await User.findOne({
      email,
      roleType: "restro-owner",
    });

    if (!restaurantOwner) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Restaurant owner not found!",
      });
    }

    const restaurantTables = await Table.find({
      restaurantId: restaurantOwner._id,
      status: { $in: ["booked"] },
    }).populate("bookedBy", "firstName lastName email mobileNo");
    res.status(200).json({
      resultCode: 0,
      resultData: restaurantTables,
      resultMessage: "Tables history by restro owner fetched successfully!",
    });
  } catch (error) {
    console.error("Error fetching tables history:", error);
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Error fetching tables history !",
    });
  }
};

// Get available tables with date filtering
exports.getAvailableTablesForCustomers = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Email is required.",
      });
    }

    // Utility to filter valid time slots (you can customize this as needed)
    const filterTimeSlots = (timeslotString, bookingDate) => {
      const currentDate = new Date();
      const bookingDay = new Date(bookingDate);
      const isToday = currentDate.toDateString() === bookingDay.toDateString();

      const slots = timeslotString.split(",").map((slot) => slot.trim());

      if (!isToday) return slots; // All slots valid for future date

      const currentTime = new Date(); // Use native JavaScript Date
      return slots.filter((slot) => {
        const [startTime] = slot.split("-"); // Assume format "10:00-11:00"
        const slotMoment = new Date(`1970-01-01T${startTime}:00Z`); // Convert to Date object
        return slotMoment > currentTime; // Only future slots today
      });
    };

    // Check if user is a customer
    const customer = await User.findOne({ email, roleType: "customer" });
    if (!customer) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Customer not found!",
      });
    }

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch only future or today's available tables
    const tables = await Table.find({
      status: "available",
      bookingDate: { $gte: today },
    }).populate("restaurantId", "restaurantName");

    // Filter tables that have available slots
    const availableTables = tables
      .map((table) => ({
        ...table.toObject(),
        availableSlots: filterTimeSlots(table.timeslot, table.bookingDate),
      }))
      .filter((table) => table.availableSlots.length > 0);

    res.status(200).json({
      resultCode: 0,
      resultData: availableTables,
      resultMessage: "Available tables fetched successfully!",
    });
  } catch (error) {
    console.error("Error fetching available tables:", error);
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Error fetching available tables!",
    });
  }
};

// Book a table
exports.bookTable = async (req, res) => {
  try {
    const { tableId, email } = req.body;

    // Validate inputs
    if (!tableId || !email) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Table ID, email, and slot are required.",
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "User not found!",
      });
    }

    // Find the table
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Table not found!",
      });
    }

    // Check if table is already booked
    if (table.status === "booked") {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Table is already booked!",
      });
    }

    // Update table status
    table.status = "booked";
    table.bookedBy = user._id;
    table.bookedAt = new Date();
    await table.save();

    res.status(200).json({
      resultCode: 0,
      resultMessage: "Table booked successfully!",
    });
  } catch (error) {
    console.error("Error booking table:", error);
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Error booking table!",
    });
  }
};

// for customer
exports.deleteTable = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTable = await Table.findByIdAndDelete(id);

    if (!deletedTable) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Table not found!",
      });
    }

    res.status(200).json({
      resultCode: 0,
      resultMessage: "Table deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting table:", error);
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Error deleting table!",
    });
  }
};

exports.updateTable = async (req, res) => {
  try {
    const { tableNumber, bookingDate, timeslot, email } = req.body;
    const { id } = req.params;
    console.log("Attempting to update table ID:", id);

    // Add validation for MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Invalid table ID format!",
      });
    }

    const restaurant = await User.findOne({ email });
    if (!restaurant) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Restaurant owner not found!",
      });
    }

    const restaurantId = restaurant._id;

    const duplicate = await Table.findOne({
      _id: { $ne: id }, // exclude the current doc
      restaurantId,
      tableNumber,
      bookingDate: new Date(bookingDate),
      timeslot,
    });

    if (duplicate) {
      return res.status(200).json({
        resultCode: 71,
        resultMessage:
          "Another table with the same number, date, and timeslot already exists!",
      });
    }
    // Debugging: Log the incoming ID
    console.log("Attempting to update table ID:", id);

    const updatedTable = await Table.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (!updatedTable) {
      console.log("No table found with ID:", id); // Debugging
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Table not found!",
      });
    }

    res.status(200).json({
      resultCode: 0,
      resultData: updatedTable,
      resultMessage: "Table updated successfully!",
    });
  } catch (error) {
    console.error("Update error:", error); // Detailed error log
    res
      .status(500)
      .json({ resultCode: 1, resultMessage: "Error updating table!" });
  }
};

// / Book a Table by customer

// exports.bookTable = async (req, res) => {
//   try {
//     const { email, tableId } = req.body;

//     if (!email || !tableId) {
//       return res.status(400).json({
//         resultCode: 1,
//         resultMessage: "Email and Table ID are required.",
//       });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({
//         resultCode: 1,
//         resultMessage: "User not found!",
//       });
//     }

//     const table = await Table.findById(tableId);
//     if (!table || table.status === "booked") {
//       return res.status(400).json({
//         resultCode: 1,
//         resultMessage: "Table is already booked or does not exist.",
//       });
//     }

//     table.status = "booked";
//     table.bookedBy = user._id;
//     table.bookedAt = new Date();
//     await table.save();

//     res.status(200).json({
//       resultCode: 0,
//       resultMessage: "Table booked successfully!",
//       resultData: table,
//     });
//   } catch (error) {
//     console.error("Error booking table:", error);
//     res.status(500).json({ resultMessage: "Error booking table!" });
//   }
// };

// Get All Bookings for a Specific User
exports.getAllBookings = async (req, res) => {
  try {
    console.log("Fetching bookings for email:", req.query.email);
    const { email } = req.query; // Get email from query parameters

    if (!email) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Email is required.",
      });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "User not found!",
      });
    }

    // Fetch all tables booked by the user
    const bookings = await Table.find({ bookedBy: user._id }).populate(
      "restaurantId",
      "restaurantName"
    );

    res.status(200).json({
      resultCode: 0,
      resultData: bookings,
      resultMessage: "Bookings fetched successfully!",
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Error fetching bookings!",
    });
  }
};

exports.getAllBookingsByRestuarant = async (req, res) => {
  try {
    const { id: restaurantId } = req.params;

    if (!restaurantId) {
      return res.status(400).json({
        resultCode: 1,
        resultMessage: "Restaurant ID is required.",
      });
    }

    // Find the restaurant by its ID
    const restaurant = await User.findById(restaurantId);

    if (!restaurant || restaurant.roleType !== "restro-owner") {
      return res.status(404).json({
        resultCode: 1,
        resultMessage: "Restaurant not found or not authorized.",
      });
    }

    // Fetch all tables booked at this restaurant
    const bookings = await Table.find({
      restaurantId: restaurant._id,
      status: "booked",
      bookingDate: { $gte: new Date() },
    })
      .populate("bookedBy", "firstName lastName email mobileNo") // Populate user details for the booking
      .populate("restaurantId", "restaurantName"); // Populate restaurant name

    console.log("Bookings found:", bookings); // Debugging

    res.status(200).json({
      resultCode: 0,
      resultData: bookings,
      resultMessage: "Restro tables Bookings  fetched successfully!",
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({
      resultCode: 1,
      resultMessage: "Error fetching bookings!",
    });
  }
};

// Add this function to your exports
exports.expireOldBookings = async (req, res) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const result = await Table.updateMany(
      {
        bookingDate: { $lt: new Date() },
        status: { $ne: "expired" },
      },
      { $set: { status: "expired" } }
    );

    // If called via API
    if (res) {
      return res.status(200).json({
        resultCode: 0,
        resultMessage: `Expired ${result.modifiedCount} old bookings`,
      });
    }

    console.log(`Expired ${result.modifiedCount} old bookings`);
  } catch (error) {
    console.error("Error expiring bookings:", error);
    if (res) {
      return res.status(500).json({
        resultCode: 1,
        resultMessage: "Error expiring old bookings",
      });
    }
  }
};
