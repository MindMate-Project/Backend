"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignDevice = exports.deviceLocation = void 0;
const User_1 = require("../models/User");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
exports.deviceLocation = (0, express_async_handler_1.default)(async (req, res) => {
    const { deviceId } = req.params;
    const user = req.user;
    if (!user || user.role !== "caregiver") {
        res.status(403);
        throw new Error("Only caregivers can access this resource");
    }
    const patient = await User_1.Patient.findOne({ "device.deviceId": deviceId });
    if (!patient) {
        res.status(404);
        throw new Error("This device not found");
    }
    const caregiverId = user._id;
    if (!patient.caregivers.includes(caregiverId)) {
        res.status(403);
        throw new Error("You are not assigned to this patient");
    }
    res.status(200).json({
        message: "device found successfuly",
        data: patient
    });
});
exports.assignDevice = (0, express_async_handler_1.default)(async (req, res) => {
    const { deviceId, patientEmail } = req.body;
    if (!deviceId || !patientEmail) {
        res.status(400);
        throw new Error("deviceId and patientEmail are required");
    }
    const usedDevice = await User_1.Patient.findOne({ "device.deviceId": deviceId });
    if (usedDevice) {
        res.status(409);
        throw new Error("This device is used by another patient");
    }
    const patient = await User_1.Patient.findOne({ email: patientEmail });
    if (!patient) {
        res.status(401);
        throw new Error("User not found");
    }
    patient.device.deviceId = deviceId;
    await patient.save();
    res.status(200).json({
        message: "device assigned to patient successfuly",
    });
});
