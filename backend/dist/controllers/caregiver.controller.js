"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removePatientFromCaregiver = exports.updatePatientInfo = exports.assignPatientToCaregiver = exports.getPatientInfo = exports.getAllPatients = void 0;
const User_1 = require("../models/User");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const mongoose_1 = require("mongoose");
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
exports.getPatientInfo = (0, express_async_handler_1.default)(async (req, res) => {
    const { patientId } = req.params;
    const user = req.user;
    if (!mongoose_1.Types.ObjectId.isValid(patientId)) {
        res.status(400);
        throw new Error("Invalid patient ID");
    }
    if (!user || user.role !== "caregiver") {
        res.status(403);
        throw new Error("Only caregivers can access this resource");
    }
    const patient = await User_1.Patient.findById(patientId);
    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }
    const caregiverId = user._id;
    const isAssignedToCaregiver = patient.caregivers.some((id) => id.equals(caregiverId));
    if (!isAssignedToCaregiver) {
        res.status(403);
        throw new Error("You are not assigned to this patient");
    }
    res.status(200).json({
        message: "Patient info retrieved successfully",
        data: patient
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
    const caregiverId = user._id;
    const isAlreadyAssigned = patient.caregivers.some((id) => id.equals(caregiverId));
    if (isAlreadyAssigned) {
        res.status(400);
        throw new Error("Patient is already assigned to this caregiver");
    }
    const existingRequest = patient.pendingCaregiverRequests?.find((request) => request.caregiver.equals(caregiverId));
    if (existingRequest && existingRequest.status === "pending") {
        res.status(409);
        throw new Error("Assignment request already sent and waiting for patient response");
    }
    if (existingRequest) {
        existingRequest.status = "pending";
        existingRequest.requestedAt = new Date();
        existingRequest.respondedAt = undefined;
    }
    else {
        patient.pendingCaregiverRequests.push({
            caregiver: caregiverId,
            status: "pending",
            requestedAt: new Date()
        });
    }
    await patient.save();
    const caregiver = await User_1.Caregiver.findById(user._id);
    if (!caregiver) {
        res.status(404);
        throw new Error("Caregiver not found");
    }
    res.status(200).json({
        message: "Assignment request sent. Waiting for patient response",
        data: {
            caregiverId,
            caregiverName: caregiver.name,
            patientId: patient._id,
            patientName: patient.name,
            patientEmail: patient.email,
        }
    });
});
exports.updatePatientInfo = (0, express_async_handler_1.default)(async (req, res) => {
    const { patientId } = req.params;
    const { name, dateOfBirth, medicalNotes } = req.body;
    const user = req.user;
    if (!mongoose_1.Types.ObjectId.isValid(patientId)) {
        res.status(400);
        throw new Error("Invalid patient ID");
    }
    if (!user || user.role !== "caregiver") {
        res.status(403);
        throw new Error("Only caregivers can access this resource");
    }
    const patient = await User_1.Patient.findById(patientId);
    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }
    const caregiverId = user._id;
    const isAssignedToCaregiver = patient.caregivers.some((id) => id.equals(caregiverId));
    if (!isAssignedToCaregiver) {
        res.status(403);
        throw new Error("You are not assigned to this patient");
    }
    const updateFields = {};
    if (name !== undefined) {
        updateFields.name = name;
    }
    if (dateOfBirth !== undefined) {
        updateFields.dateOfBirth = dateOfBirth;
    }
    if (medicalNotes !== undefined) {
        updateFields.medicalNotes = medicalNotes;
    }
    if (Object.keys(updateFields).length === 0) {
        res.status(400);
        throw new Error("No fields provided to update");
    }
    const updatedPatient = await User_1.Patient.findByIdAndUpdate(patient._id, updateFields, { new: true });
    res.status(200).json({
        message: "Patient information updated successfully",
        data: updatedPatient
    });
});
exports.removePatientFromCaregiver = (0, express_async_handler_1.default)(async (req, res) => {
    const { patientId } = req.params;
    const user = req.user;
    if (!mongoose_1.Types.ObjectId.isValid(patientId)) {
        res.status(400);
        throw new Error("Invalid patient ID");
    }
    if (!user || user.role !== "caregiver") {
        res.status(403);
        throw new Error("Only caregivers can access this resource");
    }
    const patient = await User_1.Patient.findById(patientId);
    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }
    const caregiverId = user._id;
    const isAssignedToCaregiver = patient.caregivers.some((id) => id.equals(caregiverId));
    if (!isAssignedToCaregiver) {
        res.status(403);
        throw new Error("You are not assigned to this patient");
    }
    const caregiver = await User_1.Caregiver.findByIdAndUpdate(user._id, { $pull: { patients: patient._id } }, { new: true });
    const updatedPatient = await User_1.Patient.findByIdAndUpdate(patient._id, { $pull: { caregivers: user._id } }, { new: true });
    await User_1.Patient.findByIdAndUpdate(patient._id, {
        $pull: {
            pendingCaregiverRequests: {
                caregiver: caregiverId
            }
        }
    });
    res.status(200).json({
        message: "Patient removed from caregiver successfully",
        data: {
            caregiver,
            patient: updatedPatient
        }
    });
});
