"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserInfo = exports.getUserInfo = void 0;
const User_1 = require("../models/User");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
exports.getUserInfo = (0, express_async_handler_1.default)(async (req, res) => {
    const user = req.user;
    if (!user) {
        res.status(401);
        throw new Error("User not authenticated");
    }
    if (user.role === "patient") {
        const patient = await User_1.Patient.findById(user._id).populate("caregivers", "name email phoneNumber");
        if (!patient) {
            res.status(404);
            throw new Error("Patient not found");
        }
        res.status(200).json({
            message: "User info retrieved successfully",
            data: patient
        });
        return;
    }
    else if (user.role === "caregiver") {
        const caregiver = await User_1.Caregiver.findById(user._id).populate("patients", "name email dateOfBirth medicalNotes");
        if (!caregiver) {
            res.status(404);
            throw new Error("Caregiver not found");
        }
        res.status(200).json({
            message: "User info retrieved successfully",
            data: caregiver
        });
        return;
    }
    res.status(400);
    throw new Error("Invalid user role");
});
exports.updateUserInfo = (0, express_async_handler_1.default)(async (req, res) => {
    const user = req.user;
    const { name, phoneNumber, medicalNotes } = req.body;
    if (!user) {
        res.status(401);
        throw new Error("User not authenticated");
    }
    if (user.role === "patient") {
        const patient = await User_1.Patient.findById(user._id);
        if (!patient) {
            res.status(404);
            throw new Error("Patient not found");
        }
        patient.name = name || patient.name;
        patient.medicalNotes = medicalNotes || patient.medicalNotes;
        await patient.save();
        res.status(200).json({
            message: "User info updated successfully",
            data: patient
        });
        return;
    }
    else if (user.role === "caregiver") {
        const caregiver = await User_1.Caregiver.findById(user._id);
        if (!caregiver) {
            res.status(404);
            throw new Error("Caregiver not found");
        }
        caregiver.name = name || caregiver.name;
        caregiver.phoneNumber = phoneNumber || caregiver.phoneNumber;
        await caregiver.save();
        res.status(200).json({
            message: "User info updated successfully",
            data: caregiver
        });
        return;
    }
    res.status(400);
    throw new Error("Invalid user role");
});
