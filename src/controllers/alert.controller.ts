import { User } from "../models/User";
import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Alert from "../models/Alert";

// ----------------------------------------------------------------------

/**
 * @desc Create new alert
 * @route POST /api/alerts
 * @access Private (System / Caregiver)
 */
export const createAlert = asyncHandler(async (req: Request, res: Response) => {
  const { patient_id, alert_type } = req.body;

  if (!patient_id || !alert_type) {
    res.status(400);
    throw new Error("Missing required fields");
  }
  const patient = await User.findById(patient_id);
  if (!patient || patient.role !== "patient") {
    res.status(400);
    throw new Error("Invalid patient ID");
  }
  const alert = await Alert.create({
    patient_id,
    alert_type,
    
  });

  res.status(201).json({
    message: "Alert created successfully",
    data: alert,
  });
});

// ----------------------------------------------------------------------

/**
 * @desc Get all alerts for a patient
 * @route GET /api/alerts/patient/:patientId
 * @access Private (Caregiver)
 */
export const getPatientAlerts = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;

  const alerts = await Alert.find({ patient_id: patientId });

  res.status(200).json({
    results: alerts.length,
    data: alerts,
  });
});

// ----------------------------------------------------------------------

/**
 * @desc Get single alert by ID
 * @route GET /api/alerts/:id
 * @access Private
 */
export const getAlertById = asyncHandler(async (req: Request, res: Response) => {
  const alert = await Alert.findById(req.params.id);

  if (!alert) {
    res.status(404);
    throw new Error("Alert not found");
  }

  res.status(200).json({
    data: alert,
  });
});

// ----------------------------------------------------------------------

/**
 * @desc Acknowledge alert
 * @route PUT /api/alerts/:id
 * @access Private (Caregiver)
 */
export const acknowledgeAlert = asyncHandler(async (req: Request, res: Response) => {
  const alert = await Alert.findById(req.params.id);

  if (!alert) {
    res.status(404);
    throw new Error("Alert not found");
  }
  const caregiver_id = req.body.caregiver_id;
  const caregiver = await User.findById(caregiver_id);
  if (!caregiver || caregiver.role !== "caregiver") {
    res.status(400);
    throw new Error("Invalid caregiver ID");
  }

  
  if (alert.acknowledged_by) {
    res.status(400);
    throw new Error("Alert already acknowledged");
  }

  alert.acknowledged_by = caregiver_id;

  const updatedAlert = await alert.save();

  res.status(200).json({
    message: "Alert acknowledged successfully",
    data: updatedAlert,
  });
});

// ----------------------------------------------------------------------

/**
 * @desc Delete alert
 * @route DELETE /api/alerts/:id
 * @access Private
 */
export const deleteAlert = asyncHandler(async (req: Request, res: Response) => {
  const alert = await Alert.findById(req.params.id);

  if (!alert) {
    res.status(404);
    throw new Error("Alert not found");
  }
  
  await alert.deleteOne();

  res.status(200).json({
    message: "Alert deleted successfully",
  });
});
