import dotenv from "dotenv";
dotenv.config();
import express  from "express";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes"
import memoryItemRoutes from "./routes/memoryItemRoutes"
import cors from 'cors'
connectDB();
const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/auth", authRoutes);
app.use("/api/memories", memoryItemRoutes);

const PORT = process.env.PORT || 5000;
app.get("/", (req, res) => {
  res.send(`API is running on port`);
});