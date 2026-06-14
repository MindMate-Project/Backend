import express from "express";
import {
  createAlert,
  getPatientAlerts,
  getAlertById,
  acknowledgeAlert,
  deleteAlert,
} from "../controllers/alert.controller";
import { protect } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";

const router = express.Router();

// Create alert (patient self-SOS, or caregiver for an assigned patient)
router.post("/", protect, authorize("patient", "caregiver", "admin"), createAlert);

// Get all alerts for a patient
router.get(
  "/patient/:patientId",
  protect,
  authorize("patient", "caregiver", "admin"),
  getPatientAlerts
);

// Get / Acknowledge / Delete alert by id
router
  .route("/:id")
  .get(protect, authorize("patient", "caregiver", "admin"), getAlertById)
  .put(protect, authorize("caregiver", "admin"), acknowledgeAlert)
  .delete(protect, authorize("caregiver", "admin"), deleteAlert);

export default router;
