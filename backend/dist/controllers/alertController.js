"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAlert = exports.acknowledgeAlert = exports.getAlertById = exports.getPatientAlerts = exports.createAlert = void 0;
const User_1 = require("../models/User");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Alert_1 = __importDefault(require("../models/Alert"));
// ----------------------------------------------------------------------
/**
 * @desc Create new alert
 * @route POST /api/alerts
 * @access Private (System / Caregiver)
 */
exports.createAlert = (0, express_async_handler_1.default)(async (req, res) => {
    const { patient_id, alert_type } = req.body;
    if (!patient_id || !alert_type) {
        res.status(400);
        throw new Error("Missing required fields");
    }
    const patient = await User_1.User.findById(patient_id);
    if (!patient || patient.role !== "patient") {
        res.status(400);
        throw new Error("Invalid patient ID");
    }
    const alert = await Alert_1.default.create({
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
exports.getPatientAlerts = (0, express_async_handler_1.default)(async (req, res) => {
    const { patientId } = req.params;
    const alerts = await Alert_1.default.find({ patient_id: patientId });
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
exports.getAlertById = (0, express_async_handler_1.default)(async (req, res) => {
    const alert = await Alert_1.default.findById(req.params.id);
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
exports.acknowledgeAlert = (0, express_async_handler_1.default)(async (req, res) => {
    const alert = await Alert_1.default.findById(req.params.id);
    if (!alert) {
        res.status(404);
        throw new Error("Alert not found");
    }
    const caregiver_id = req.body.caregiver_id;
    const caregiver = await User_1.User.findById(caregiver_id);
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
exports.deleteAlert = (0, express_async_handler_1.default)(async (req, res) => {
    const alert = await Alert_1.default.findById(req.params.id);
    if (!alert) {
        res.status(404);
        throw new Error("Alert not found");
    }
    await alert.deleteOne();
    res.status(200).json({
        message: "Alert deleted successfully",
    });
});
