"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reminderController_1 = require("../controllers/reminderController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const authorize_1 = require("../middlewares/authorize");
const router = express_1.default.Router();
router.post("/", authMiddleware_1.protect, (0, authorize_1.authorize)("caregiver", "admin"), reminderController_1.createReminder);
router.get("/patient/:patientId", authMiddleware_1.protect, (0, authorize_1.authorize)("caregiver", "patient", "admin"), reminderController_1.getPatientReminders);
router
    .route("/:id")
    .get(authMiddleware_1.protect, reminderController_1.getReminderById)
    .put(authMiddleware_1.protect, (0, authorize_1.authorize)("caregiver", "admin"), reminderController_1.updateReminder)
    .delete(authMiddleware_1.protect, (0, authorize_1.authorize)("caregiver", "admin"), reminderController_1.deleteReminder);
exports.default = router;
