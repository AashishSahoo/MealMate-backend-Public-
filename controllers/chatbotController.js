const User = require("../models/User");
const Table = require("../models/Table");
const Order = require("../models/Order");
const Food = require("../models/Food");
const Payment = require("../models/Payment");
const Category = require("../models/Category");
const Cart = require("../models/Cart");
const mongoose = require("mongoose");
const OpenAI = require("openai");

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_DEEPSEEK_R1_API_KEY,
});

exports.getDataForAI = async (req, res) => {
  try {
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
        resultMessage: "User not found with provided email id",
      });
    }

    const userId = user._id;

    const userData = await User.findById(userId);
    const tableBookings = await Table.find({ bookedBy: userId });
    const orders = await Order.find({ user: userId });
    const payments = await Payment.find({ user: userId });
    const foods = await Food.find();
    const categories = await Category.find(); // Assuming you imported Category model too!

    return res.status(200).json({
      resultCode: 0,
      resultMessage: "ChatBot Data For Training fetched successfully",
      resultData: {
        userData,
        tableBookings,
        orders,
        payments,
        foods,
        categories,
      },
    });
  } catch (error) {
    return res.status(500).json({
      resultCode: 1,
      resultMessage: error.message,
    });
  }
};

exports.getAIResponse = async (req, res) => {
  const { message, userData } = req.body;

  const platformInfo = `
Platform Name: MealMate
Project Status: Under Progress (Started in 2025)

Developed By: Ashish Sahoo
Developer Information:
  - Portfolio: https://portfolio-seven-tan-71.vercel.app/
  - GitHub: https://github.com/AashishSahoo/
  - LinkedIn: https://www.linkedin.com/in/ashishsahoo899/
  - Email: ashishsahoo0013@gmail.com
  - Education:
      * Master's in Computer Application (MCA)
        - Savitribai Phule Pune University
        - 2022-2024
        - CGPA: 8.18/10
      * Bachelor's Degree in Computer Science
        - Savitribai Phule Pune University
        - 2019-2022
        - CGPA: 7.82/10
      * H.S.C (Science Stream)
        - Maharashtra Board
        - Year: 2019
        - Percentage: 70.4%
      * S.S.C
        - Maharashtra Board
        - Year: 2017
        - Percentage: 83.2%

About Developer:
Ashish Sahoo is a passionate software developer with 7 months of Frontend Developer internship experience specializing in React, JavaScript, TypeScript, Next.js, and Material UI.
He has built responsive UIs, integrated REST APIs, and developed full-fledged MERN stack applications from scratch, including dynamic modules and analytics features.
Currently seeking MERN Stack Developer roles to further enhance his full-stack development journey.

Tech Stack Used:
- Node.js
- Express.js
- MongoDB
- React.js
- Material UI

Key Features of MealMate:
- Online Food Ordering System
- Table Booking Functionality
- Payment Gateway Integration (using Razorpay Test Mode)
- AI-powered Chatbot (powered by DeepSeek R1 model)
- Role-Based Access Control (Admin/Restro Owner/User modules)
- Restro Owner Onboarding based on ID proof submission
`;

  const prompt = `
You are a helpful chatbot named cano for MealMate, an online food ordering and table booking application.

Platform Information:
${platformInfo}

Here is the user's data:
${JSON.stringify(userData)}

User's Question: "${message}"

Give a clear, professional, and helpful answer based on the platform info and user data.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1:free",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const aiMessage = completion.choices[0].message.content;
    res.status(200).json({
      resultCode: 0,
      resultData: aiMessage,
      resultMessage: "AI reply fetched successfully",
    });
  } catch (error) {
    console.error("OpenRouter API error:", error);
    return res.status(500).json({
      resultCode: 1,
      resultMessage: error.message,
    });
  }
};
