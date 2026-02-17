import dotenv from "dotenv";
dotenv.config();
import express  from "express";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes"
import memoryItemRoutes from "./routes/memoryItemRoutes"
import deviceRoutes from "./routes/deviceRoutes"
import caregiverRoutes from "./routes/caregiverRoutes"
import reminderRoutes from "./routes/reminderRoutes"
import alertRoutes from "./routes/alertRoutes"
import faceRouter from "./routes/faceRoutes"

import cors from 'cors'
connectDB();
const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/auth", authRoutes);
app.use("/api/memories", memoryItemRoutes);
app.use("/api/caregiver", caregiverRoutes);
app.use("/api/reminders",reminderRoutes)
app.use("/api/alerts", alertRoutes);
app.use("/api/device", deviceRoutes);
app.use("/api/face/patient", faceRouter);

const PORT = process.env.PORT || 4000;
app.get("/", (req, res) => {
  res.send(`API is running on port ${PORT}`);
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});