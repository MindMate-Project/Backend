import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    if (!process.env.MONGO_URL)
       {
      throw new Error("MONGO_URL is not defined in environment variables");
       }
    const conn = await mongoose.connect(process.env.MONGO_URL);
  console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export default connectDB;
