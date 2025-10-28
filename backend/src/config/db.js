import mongoose from "mongoose";
import asyncHandler from "express-async-handler";

const connectDB = asyncHandler(async () => {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("MongoDB connected");
});

export default connectDB;
