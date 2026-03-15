import { Request, Response } from "express";
import { Patient, IPatient, Caregiver, ICaregiver } from "../models/User";
import asyncHandler from "express-async-handler";
import { Types } from "mongoose";
import { removePatientFromCaregiver } from "./caregiver.controller";

export const getUserInfo = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;

    if (!user) {
        res.status(401);
        throw new Error("User not authenticated");
    }

    if (user.role === "patient") {
        const patient = await Patient
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

    } else if (user.role === "caregiver") {
        const caregiver = await Caregiver
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

export const updateUserInfo = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const { name, phoneNumber, medicalNotes } = req.body;

    if (!user) {
        res.status(401);
        throw new Error("User not authenticated");
    }

    if (user.role === "patient") {
        const patient = await Patient.findById(user._id);
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

    } else if (user.role === "caregiver") {
        const caregiver = await Caregiver.findById(user._id);
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