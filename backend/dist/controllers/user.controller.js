"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProfilePicture = exports.uploadProfilePicture = exports.updateUserInfo = exports.getUserInfo = void 0;
const User_1 = require("../models/User");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
// ----------------------------------------------------------------------
exports.getUserInfo = (0, express_async_handler_1.default)(async (req, res) => {
    const user = req.user;
    if (!user) {
        res.status(401);
        throw new Error("User not authenticated");
    }
    if (user.role === "patient") {
        const patient = await User_1.Patient
            .findById(user._id)
            .select('-password -verificationToken -passwordResetToken -passwordResetExpires -resetSessionToken')
            .populate("caregivers", "name email phoneNumber");
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
        const caregiver = await User_1.Caregiver
            .findById(user._id)
            .select('-password -verificationToken -passwordResetToken -passwordResetExpires -resetSessionToken')
            .populate({
            path: "patients.patient",
            model: "User",
            select: "name email dateOfBirth medicalNotes"
        });
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
// ----------------------------------------------------------------------
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
// ----------------------------------------------------------------------
/**
 * @desc Upload or update profile picture
 * @route POST /api/users/profile-picture
 * @access Private (all roles)
 */
exports.uploadProfilePicture = (0, express_async_handler_1.default)(async (req, res) => {
    const user = req.user;
    const file = req.file;
    if (!user) {
        res.status(401);
        throw new Error("Not authenticated");
    }
    if (!file) {
        res.status(400);
        throw new Error("No image file provided");
    }
    // Delete old picture from Cloudinary if it exists
    const existingUser = await User_1.User.findById(user._id);
    if (existingUser?.profilePicture_public_id) {
        await cloudinary_1.default.uploader.destroy(existingUser.profilePicture_public_id, {
            resource_type: "image",
        });
    }
    const updatedUser = await User_1.User.findByIdAndUpdate(user._id, {
        profilePicture: file.path,
        profilePicture_public_id: file.filename,
    }, { new: true }).select("-password -verificationToken -passwordResetToken -passwordResetExpires -resetSessionToken");
    res.status(200).json({
        message: "Profile picture updated successfully",
        data: {
            profilePicture: updatedUser?.profilePicture,
        },
    });
});
// ----------------------------------------------------------------------
/**
 * @desc Delete profile picture
 * @route DELETE /api/users/profile-picture
 * @access Private (all roles)
 */
exports.deleteProfilePicture = (0, express_async_handler_1.default)(async (req, res) => {
    const user = req.user;
    if (!user) {
        res.status(401);
        throw new Error("Not authenticated");
    }
    const existingUser = await User_1.User.findById(user._id);
    if (!existingUser) {
        res.status(404);
        throw new Error("User not found");
    }
    if (!existingUser.profilePicture_public_id) {
        res.status(400);
        throw new Error("No profile picture to delete");
    }
    await cloudinary_1.default.uploader.destroy(existingUser.profilePicture_public_id, {
        resource_type: "image",
    });
    await User_1.User.findByIdAndUpdate(user._id, {
        profilePicture: null,
        profilePicture_public_id: null,
    });
    res.status(200).json({
        message: "Profile picture deleted successfully",
    });
});
