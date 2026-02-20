"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reminder_controller_1 = require("../controllers/reminder.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const authorize_middleware_1 = require("../middlewares/authorize.middleware");
const router = express_1.default.Router();
router.post("/", auth_middleware_1.protect, (0, authorize_middleware_1.authorize)("caregiver", "admin"), reminder_controller_1.createReminder);
router.get("/patient/:patientId", auth_middleware_1.protect, (0, authorize_middleware_1.authorize)("caregiver", "patient", "admin"), reminder_controller_1.getPatientReminders);
router
    .route("/:id")
    .get(auth_middleware_1.protect, reminder_controller_1.getReminderById)
    .put(auth_middleware_1.protect, (0, authorize_middleware_1.authorize)("caregiver", "admin"), reminder_controller_1.updateReminder)
    .delete(auth_middleware_1.protect, (0, authorize_middleware_1.authorize)("caregiver", "admin"), reminder_controller_1.deleteReminder);
exports.default = router;
