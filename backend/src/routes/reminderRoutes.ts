import express from "express";
import {
  createReminder,
  getPatientReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
} from "../controllers/reminderController";

const router = express.Router();

// Create reminder
router.post("/", createReminder);

// Get all reminders for a patient
router.get("/patient/:patientId", getPatientReminders);

// Get / Update / Delete reminder by id
router
  .route("/:id")
  .get(getReminderById)
  .put(updateReminder)
  .delete(deleteReminder);

export default router;
