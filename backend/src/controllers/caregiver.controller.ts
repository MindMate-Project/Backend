import { Request, Response } from "express";
import { Caregiver, IPatient, Patient } from "../models/User";
import asyncHandler from "express-async-handler";

export const getAllPatients = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;

    if (!user || user.role !== "caregiver") {
        res.status(403);
        throw new Error("Only caregivers can access this resource");
    }

    const caregiver = await Caregiver.findById(user._id).populate("patients");

    if (!caregiver) {
        res.status(401);
        throw new Error("Caregiver not found");
    }

    
    res.status(200).json({
        message: "Patients retrieved successfully",
        data: caregiver.patients
    });
});

export const assignPatientToCaregiver = asyncHandler(async (req: Request, res: Response) => {
    const { patientEmail } = req.body;
    const user = req.user;

    if (!user || user.role !== "caregiver") {
        res.status(403);
        throw new Error("Only caregivers can access this resource");
    }
    
    const patient = await Patient.findOne({email: patientEmail });

    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }


    const caregiver = await Caregiver.findByIdAndUpdate(user._id, { $addToSet: { patients: patient._id } }, { new: true });
    const updatedPatient = await Patient.findByIdAndUpdate(patient._id, { $addToSet: { caregivers: user._id } }, { new: true });

    res.status(200).json({
        message: "Patient assigned to caregiver successfully",
        data: {
            caregiver,
            patient: updatedPatient
        }
    });
});

export const removePatientFromCaregiver = asyncHandler(async (req: Request, res: Response) => {
    const { patientEmail } = req.body;
    const user = req.user;

    if (!user || user.role !== "caregiver") {
        res.status(403);
        throw new Error("Only caregivers can access this resource");
    }

    const patient = await Patient.findOne({ email: patientEmail });

    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }

    const caregiver = await Caregiver.findByIdAndUpdate(user._id, { $pull: { patients: patient._id } }, { new: true });
    const updatedPatient = await Patient.findByIdAndUpdate(patient._id, { $pull: { caregivers: user._id } }, { new: true });

    res.status(200).json({
        message: "Patient removed from caregiver successfully",
        data: {
            caregiver,
            patient: updatedPatient
        }
    });
});