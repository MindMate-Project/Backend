import dotenv from "dotenv";
dotenv.config();
import express from "express";
import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes";
import memoryItemRoutes from "./routes/memoryItem.routes";
import deviceRoutes from "./routes/device.routes";
import caregiverRoutes from "./routes/caregiver.routes";
import patientRoutes from "./routes/patient.routes";
import reminderRoutes from "./routes/reminder.routes";
import alertRoutes from "./routes/alert.routes";
import faceRouter from "./routes/face.routes";
import userRoutes from "./routes/user.routes"; 
import { setupSwagger } from "./config/swagger";
import http from "http";
import { IoTService } from "./services/IoT.service";
import { setupLocationSocket } from "./services/socket.service";
import { startReminderCron } from "./jops/reminderCron";
import { startDeviceOfflineCron } from "./jops/deviceOfflineCron";
import { startUnacknowledgedReminderCron } from "./jops/unacknowledgedReminderCron";
import cors from "cors";
import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { notFound, errorHandler } from "./middlewares/error.middleware";
connectDB();
startReminderCron();
startDeviceOfflineCron();
startUnacknowledgedReminderCron();
const app = express();
// Render (and most PaaS hosts) sit behind a reverse proxy; without this,
// req.ip resolves to the proxy's address for every request, so the IP-keyed
// rate limiters below would bucket all clients together instead of per-client.
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
setupSwagger(app);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors());
const server = http.createServer(app);

export const io = setupLocationSocket(server);
const iotService = new IoTService();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many attempts, please try again later." },
});
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);                     
app.use("/api/memories", memoryItemRoutes);
app.use("/api/caregiver", caregiverRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/device", deviceRoutes);
app.use("/api/face/patient", faceRouter);

const PORT = process.env.PORT || 4000;
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: `API is running on port ${PORT}`,
    });
});

app.use(notFound);
app.use(errorHandler);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});