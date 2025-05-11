// const multer = require("multer");

// // Configure Multer storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/restaurant-owners/"); // Change path as needed
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });

// // Initialize multer
// const upload = multer({ storage });

// module.exports = { upload }; // Ensure you're exporting { upload }

const fs = require("fs");
const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join("uploads", "restaurant-owners");

    // Ensure directory exists
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

module.exports = { upload };
