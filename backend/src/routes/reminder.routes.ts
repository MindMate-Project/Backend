import express from "express";
import {
  createReminder,
  getPatientReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
} from "../controllers/reminder.controller";
import { protect } from "../middlewares/auth.middleware";  
import { authorize } from "../middlewares/authorize.middleware";
const router = express.Router();

router.post(
  "/",
  protect,
  authorize("caregiver", "admin"),
  createReminder
);

router.get(
  "/patient/:patientId",
  protect,
  authorize("caregiver", "patient", "admin"),
  getPatientReminders
);

router
  .route("/:id")
  .get(protect, getReminderById)
  .put(
    protect,
    authorize("caregiver", "admin"),
    updateReminder
  )
  .delete(
    protect,
    authorize("caregiver", "admin"),
    deleteReminder
  );
export default router;
