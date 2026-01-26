import dotenv from "dotenv";
dotenv.config();
import express  from "express";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes"
import memoryItemRoutes from "./routes/memoryItemRoutes"
import reminderRoutes from "./routes/reminderRoutes"
import alertRoutes from "./routes/alertRoutes"
import cors from 'cors'
connectDB();
const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/auth", authRoutes);
app.use("/api/memories", memoryItemRoutes);
app.use("/api/reminders",reminderRoutes)
app.use("/api/alerts", alertRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));