"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("./config/db"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const memoryItemRoutes_1 = __importDefault(require("./routes/memoryItemRoutes"));
<<<<<<< HEAD
const reminderRoutes_1 = __importDefault(require("./routes/reminderRoutes"));
const alertRoutes_1 = __importDefault(require("./routes/alertRoutes"));
const cors_1 = __importDefault(require("cors"));
=======
const faceRoutes_1 = __importDefault(require("./routes/faceRoutes"));
>>>>>>> main
(0, db_1.default)();
const app = (0, express_1.default)();
app.use(express_1.default.json());
// app.use(cors());
app.use("/api/auth", authRoutes_1.default);
app.use("/api/memories", memoryItemRoutes_1.default);
<<<<<<< HEAD
app.use("/api/reminders", reminderRoutes_1.default);
app.use("/api/alerts", alertRoutes_1.default);
=======
app.use("/api/face/patient", faceRoutes_1.default);
>>>>>>> main
const PORT = process.env.PORT || 5000;
app.get("/", (req, res) => {
    res.send(`API is running on port`);
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
