import { User } from "../models/User";
import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Types } from "mongoose";
import Alert from "../models/Alert";
import { canAccessPatient } from "../utils/ownership";

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

  if (!Types.ObjectId.isValid(patient_id)) {
    res.status(400);
    throw new Error("Invalid patient ID");
  }

  const patient = await User.findById(patient_id);
  if (!patient || patient.role !== "patient") {
    res.status(400);
    throw new Error("Invalid patient ID");
  }

  if (!(await canAccessPatient(req.user, patient_id))) {
    res.status(403);
    throw new Error("You are not allowed to create alerts for this patient");
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

  if (!Types.ObjectId.isValid(patientId)) {
    res.status(400);
    throw new Error("Invalid patient ID");
  }

  if (!(await canAccessPatient(req.user, patientId))) {
    res.status(403);
    throw new Error("Access denied");
  }

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
  if (!Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid alert ID");
  }

  const alert = await Alert.findById(req.params.id);

  if (!alert) {
    res.status(404);
    throw new Error("Alert not found");
  }

  if (!(await canAccessPatient(req.user, alert.patient_id))) {
    res.status(403);
    throw new Error("Access denied");
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
  if (!Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid alert ID");
  }

  const alert = await Alert.findById(req.params.id);

  if (!alert) {
    res.status(404);
    throw new Error("Alert not found");
  }
  // The acknowledging caregiver is the authenticated user (route restricts to
  // caregiver/admin) and must manage this patient — not a client-supplied id.
  if (!(await canAccessPatient(req.user, alert.patient_id))) {
    res.status(403);
    throw new Error("Access denied");
  }

  if (alert.acknowledged_by) {
    res.status(400);
    throw new Error("Alert already acknowledged");
  }

  alert.acknowledged_by = req.user!._id as any;

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
  if (!Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid alert ID");
  }

  const alert = await Alert.findById(req.params.id);

  if (!alert) {
    res.status(404);
    throw new Error("Alert not found");
  }

  if (!(await canAccessPatient(req.user, alert.patient_id))) {
    res.status(403);
    throw new Error("Access denied");
  }

  await alert.deleteOne();

  res.status(200).json({
    message: "Alert deleted successfully",
  });
});
