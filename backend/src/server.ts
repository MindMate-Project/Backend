import dotenv from "dotenv";
dotenv.config();
import express  from "express";
import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes"
import memoryItemRoutes from "./routes/memoryItem.routes"
import deviceRoutes from "./routes/device.routes"
import caregiverRoutes from "./routes/caregiver.routes"
import reminderRoutes from "./routes/reminder.routes"
import alertRoutes from "./routes/alert.routes"
import faceRouter from "./routes/face.routes"
import http from "http";
import { IoTService } from "./services/IoT.service";
import { setupLocationSocket } from "./services/socket.service";
import cors from 'cors';

connectDB();
const app = express();
app.use(express.json());
app.use(cors());
const server = http.createServer(app);

export const io = setupLocationSocket(server);
const iotService = new IoTService();

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
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});