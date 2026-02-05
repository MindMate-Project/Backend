import express from "express";
import {
  createReminder,
  getPatientReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
} from "../controllers/reminderController";
import { protect } from "../middlewares/authMiddleware";  
import { authorize } from "../middlewares/authorize";
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
