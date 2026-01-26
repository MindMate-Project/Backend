"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reminderController_1 = require("../controllers/reminderController");
const router = express_1.default.Router();
// Create reminder
router.post("/", reminderController_1.createReminder);
// Get all reminders for a patient
router.get("/patient/:patientId", reminderController_1.getPatientReminders);
// Get / Update / Delete reminder by id
router
    .route("/:id")
    .get(reminderController_1.getReminderById)
    .put(reminderController_1.updateReminder)
    .delete(reminderController_1.deleteReminder);
exports.default = router;
