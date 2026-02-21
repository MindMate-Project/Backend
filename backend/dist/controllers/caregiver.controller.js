"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removePatientFromCaregiver = exports.assignPatientToCaregiver = exports.getAllPatients = void 0;
const User_1 = require("../models/User");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
exports.getAllPatients = (0, express_async_handler_1.default)(async (req, res) => {
    const user = req.user;
    if (!user || user.role !== "caregiver") {
        res.status(403);
        throw new Error("Only caregivers can access this resource");
    }
    const caregiver = await User_1.Caregiver.findById(user._id).populate("patients");
    if (!caregiver) {
        res.status(401);
        throw new Error("Caregiver not found");
    }
    res.status(200).json({
        message: "Patients retrieved successfully",
        data: caregiver.patients
    });
});
exports.assignPatientToCaregiver = (0, express_async_handler_1.default)(async (req, res) => {
    const { patientEmail } = req.body;
    const user = req.user;
    if (!user || user.role !== "caregiver") {
        res.status(403);
        throw new Error("Only caregivers can access this resource");
    }
    const patient = await User_1.Patient.findOne({ email: patientEmail });
    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }
    const caregiver = await User_1.Caregiver.findByIdAndUpdate(user._id, { $addToSet: { patients: patient._id } }, { new: true });
    const updatedPatient = await User_1.Patient.findByIdAndUpdate(patient._id, { $addToSet: { caregivers: user._id } }, { new: true });
    res.status(200).json({
        message: "Patient assigned to caregiver successfully",
        data: {
            caregiver,
            patient: updatedPatient
        }
    });
});
exports.removePatientFromCaregiver = (0, express_async_handler_1.default)(async (req, res) => {
    const { patientEmail } = req.body;
    const user = req.user;
    if (!user || user.role !== "caregiver") {
        res.status(403);
        throw new Error("Only caregivers can access this resource");
    }
    const patient = await User_1.Patient.findOne({ email: patientEmail });
    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }
    const caregiver = await User_1.Caregiver.findByIdAndUpdate(user._id, { $pull: { patients: patient._id } }, { new: true });
    const updatedPatient = await User_1.Patient.findByIdAndUpdate(patient._id, { $pull: { caregivers: user._id } }, { new: true });
    res.status(200).json({
        message: "Patient removed from caregiver successfully",
        data: {
            caregiver,
            patient: updatedPatient
        }
    });
});
