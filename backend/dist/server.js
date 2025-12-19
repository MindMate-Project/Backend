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
const cors_1 = __importDefault(require("cors"));
(0, db_1.default)();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use("/api/auth", authRoutes_1.default);
app.use("/api/memories", memoryItemRoutes_1.default);
const PORT = process.env.PORT || 5000;
app.get("/", (req, res) => {
    res.send(`API is running on port`);
});
