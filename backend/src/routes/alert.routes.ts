import express from "express";
import {
  createAlert,
  getPatientAlerts,
  getAlertById,
  acknowledgeAlert,
  deleteAlert,
} from "../controllers/alert.controller";

const router = express.Router();

// Create alert
router.post("/", createAlert);

// Get all alerts for a patient
router.get("/patient/:patientId", getPatientAlerts);

// Get / Update / Delete alert by id
router
  .route("/:id")
  .get(getAlertById)
  .put(acknowledgeAlert)
  .delete(deleteAlert);

export default router;
