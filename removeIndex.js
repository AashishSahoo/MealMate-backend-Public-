require("dotenv").config(); // Load environment variables from .env
const mongoose = require("mongoose");

async function removeIndex() {
  if (!process.env.REACT_DB_CONNECT) {
    console.error("MongoDB connection string is missing in .env file!");
    process.exit(1);
  }

  await mongoose.connect(process.env.REACT_DB_CONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const User = mongoose.model("User", new mongoose.Schema({}), "user");

  try {
    await User.collection.dropIndex("username_1");
    console.log("Index 'username_1' dropped successfully");
  } catch (error) {
    console.error("Error dropping index:", error);
  }

  mongoose.connection.close();
}

removeIndex();
