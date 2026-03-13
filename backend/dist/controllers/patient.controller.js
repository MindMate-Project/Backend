"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeCaregiverFromPatient = exports.respondToCaregiverRequest = exports.getPendingCaregiverRequests = exports.getCaregiverInfo = exports.getAllCaregivers = void 0;
const User_1 = require("../models/User");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const mongoose_1 = require("mongoose");
exports.getAllCaregivers = (0, express_async_handler_1.default)(async (req, res) => {
    const user = req.user;
    if (!user || user.role !== "patient") {
        res.status(403);
        throw new Error("Only patients can access this resource");
    }
    const patient = await User_1.Patient.findById(user._id);
    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }
    const caregivers = await User_1.Caregiver.find({ _id: { $in: patient.caregivers } }).select("_id name email phoneNumber");
    res.status(200).json({
        message: "Caregivers retrieved successfully",
        data: caregivers
    });
});
exports.getCaregiverInfo = (0, express_async_handler_1.default)(async (req, res) => {
    const { caregiverId } = req.params;
    const user = req.user;
    if (!mongoose_1.Types.ObjectId.isValid(caregiverId)) {
        res.status(400);
        throw new Error("Invalid caregiver ID");
    }
    if (!user || user.role !== "patient") {
        res.status(403);
        throw new Error("Only patients can access this resource");
    }
    const patient = await User_1.Patient.findById(user._id);
    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }
    const isAssignedToCaregiver = patient.caregivers.some((id) => id.equals(caregiverId));
    if (!isAssignedToCaregiver) {
        res.status(403);
        throw new Error("You are not assigned to this caregiver");
    }
    const caregiver = await User_1.Caregiver.findById(caregiverId)
        .select('-password -verificationToken -passwordResetToken -passwordResetExpires -resetSessionToken');
    if (!caregiver) {
        res.status(404);
        throw new Error("Caregiver not found");
    }
    res.status(200).json({
        message: "Caregiver info retrieved successfully",
        data: caregiver
    });
});
exports.getPendingCaregiverRequests = (0, express_async_handler_1.default)(async (req, res) => {
    const user = req.user;
    if (!user || user.role !== "patient") {
        res.status(403);
        throw new Error("Only patients can access this resource");
    }
    const patient = await User_1.Patient.findById(user._id).populate("pendingCaregiverRequests.caregiver", "name email phoneNumber");
    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }
    const pendingRequests = patient.pendingCaregiverRequests.filter((request) => request.status === "pending");
    res.status(200).json({
        message: "Pending caregiver requests retrieved successfully",
        data: pendingRequests
    });
});
exports.respondToCaregiverRequest = (0, express_async_handler_1.default)(async (req, res) => {
    const { caregiverId } = req.params;
    const { action } = req.body;
    const user = req.user;
    if (!mongoose_1.Types.ObjectId.isValid(caregiverId)) {
        res.status(400);
        throw new Error("Invalid caregiver ID");
    }
    if (!user || user.role !== "patient") {
        res.status(403);
        throw new Error("Only patients can access this resource");
    }
    if (!["accept", "reject"].includes(action)) {
        res.status(400);
        throw new Error("Valid action (accept/reject) is required");
    }
    const patient = await User_1.Patient.findById(user._id);
    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }
    const request = patient.pendingCaregiverRequests.find((pendingRequest) => pendingRequest.caregiver.equals(caregiverId) &&
        pendingRequest.status === "pending");
    if (!request) {
        res.status(404);
        throw new Error("No pending assignment request found for this caregiver");
    }
    if (action === "accept") {
        await User_1.Caregiver.findByIdAndUpdate(caregiverId, {
            $addToSet: {
                patients: {
                    patient: patient._id,
                    relationship: request.relationship,
                    connectedAt: new Date()
                }
            }
        });
        const isAlreadyAssigned = patient.caregivers.some((id) => id.equals(caregiverId));
        if (!isAlreadyAssigned) {
            patient.caregivers.push(caregiverId);
        }
        patient.pendingCaregiverRequests = patient.pendingCaregiverRequests.filter((req) => !req.caregiver.equals(caregiverId));
        await patient.save();
        const updatedPatient = await User_1.Patient.findById(patient._id)
            .select('-password -verificationToken -passwordResetToken -passwordResetExpires -resetSessionToken');
        const updatedCaregiver = await User_1.Caregiver.findById(caregiverId)
            .select('-password -verificationToken -passwordResetToken -passwordResetExpires -resetSessionToken');
        res.status(200).json({
            message: "Caregiver request accepted successfully",
            data: {
                patient: updatedPatient,
                caregiver: updatedCaregiver
            }
        });
        return;
    }
    await User_1.Patient.findByIdAndUpdate(user._id, {
        $pull: {
            pendingCaregiverRequests: { caregiver: caregiverId }
        }
    });
    res.status(200).json({
        message: "Caregiver request rejected successfully"
    });
});
exports.removeCaregiverFromPatient = (0, express_async_handler_1.default)(async (req, res) => {
    const { caregiverId } = req.params;
    const user = req.user;
    if (!mongoose_1.Types.ObjectId.isValid(caregiverId)) {
        res.status(400);
        throw new Error("Invalid caregiver ID");
    }
    if (!user || user.role !== "patient") {
        res.status(403);
        throw new Error("Only patients can access this resource");
    }
    const patient = await User_1.Patient.findById(user._id);
    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }
    const isAssignedToCaregiver = patient.caregivers.some((id) => id.equals(caregiverId));
    if (!isAssignedToCaregiver) {
        res.status(403);
        throw new Error("You are not assigned to this caregiver");
    }
    await User_1.Caregiver.findByIdAndUpdate(caregiverId, {
        $pull: { patients: { patient: patient._id } }
    });
    patient.caregivers = patient.caregivers.filter((id) => !id.equals(caregiverId));
    await patient.save();
    await User_1.Patient.findByIdAndUpdate(patient._id, {
        $pull: {
            pendingCaregiverRequests: {
                caregiver: caregiverId
            }
        }
    });
    res.status(200).json({
        message: "Caregiver removed from patient successfully"
    });
});
