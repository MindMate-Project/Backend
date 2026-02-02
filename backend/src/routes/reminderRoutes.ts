import express from "express";
import {
  createReminder,
  getPatientReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
} from "../controllers/reminderController";
import { protect } from "../middlewares/authMiddleware";  
const router = express.Router();

// Create reminder
router.post("/", createReminder);

// Get all reminders for a patient
router.get("/patient/:patientId", getPatientReminders);

// Get / Update / Delete reminder by id
router
  .route("/:id")
  .get(getReminderById)
  .put(protect,updateReminder)
  .delete(protect,deleteReminder);

export default router;
