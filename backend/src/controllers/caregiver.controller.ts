import { Request, Response } from "express";
import { Caregiver, IPatient, Patient } from "../models/User";
import asyncHandler from "express-async-handler";
import { Types } from "mongoose";

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

export const getPatientInfo = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const user = req.user;

    if (!Types.ObjectId.isValid(patientId)) {
        res.status(400);
        throw new Error("Invalid patient ID");
    }

    if (!user || user.role !== "caregiver") {
        res.status(403);
        throw new Error("Only caregivers can access this resource");
    }

    const patient = await Patient.findById(patientId);

    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }

    const caregiverId = user._id as Types.ObjectId;

    const isAssignedToCaregiver = patient.caregivers.some((id: Types.ObjectId) =>
        id.equals(caregiverId)
    );

    if (!isAssignedToCaregiver) {
        res.status(403);
        throw new Error("You are not assigned to this patient");
    }

    res.status(200).json({
        message: "Patient info retrieved successfully",
        data: patient
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

    const caregiverId = user._id as Types.ObjectId;

    const isAlreadyAssigned = patient.caregivers.some((id: Types.ObjectId) =>
        id.equals(caregiverId)
    );

    if (isAlreadyAssigned) {
        res.status(400);
        throw new Error("Patient is already assigned to this caregiver");
    }

    const existingRequest = patient.pendingCaregiverRequests?.find((request) =>
        request.caregiver.equals(caregiverId)
    );

    if (existingRequest && existingRequest.status === "pending") {
        res.status(409);
        throw new Error("Assignment request already sent and waiting for patient response");
    }

    if (existingRequest) {
        existingRequest.status = "pending";
        existingRequest.requestedAt = new Date();
        existingRequest.respondedAt = undefined;
    } else {
        patient.pendingCaregiverRequests.push({
            caregiver: caregiverId,
            status: "pending",
            requestedAt: new Date()
        });
    }

    await patient.save();

    const caregiver = await Caregiver.findById(user._id);

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

export const updatePatientInfo = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { name, dateOfBirth, medicalNotes } = req.body;
    const user = req.user;

    if (!Types.ObjectId.isValid(patientId)) {
        res.status(400);
        throw new Error("Invalid patient ID");
    }

    if (!user || user.role !== "caregiver") {
        res.status(403);
        throw new Error("Only caregivers can access this resource");
    }

    const patient = await Patient.findById(patientId);

    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }

    const caregiverId = user._id as Types.ObjectId;

    const isAssignedToCaregiver = patient.caregivers.some((id: Types.ObjectId) =>
        id.equals(caregiverId)
    );

    if (!isAssignedToCaregiver) {
        res.status(403);
        throw new Error("You are not assigned to this patient");
    }

    const updateFields: Partial<IPatient> = {};

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

    const updatedPatient = await Patient.findByIdAndUpdate(
        patient._id,
        updateFields,
        { new: true }
    );
    
    res.status(200).json({
        message: "Patient information updated successfully",
        data: updatedPatient
    });
});

export const removePatientFromCaregiver = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const user = req.user;

    if (!Types.ObjectId.isValid(patientId)) {
        res.status(400);
        throw new Error("Invalid patient ID");
    }

    if (!user || user.role !== "caregiver") {
        res.status(403);
        throw new Error("Only caregivers can access this resource");
    }

    const patient = await Patient.findById(patientId);

    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }
    const caregiverId = user._id as Types.ObjectId;

    const isAssignedToCaregiver = patient.caregivers.some((id: Types.ObjectId) =>
        id.equals(caregiverId)
    );

    if (!isAssignedToCaregiver) {
        res.status(403);
        throw new Error("You are not assigned to this patient");
    }

    const caregiver = await Caregiver.findByIdAndUpdate(user._id, { $pull: { patients: patient._id } }, { new: true });
    const updatedPatient = await Patient.findByIdAndUpdate(patient._id, { $pull: { caregivers: user._id } }, { new: true });

    await Patient.findByIdAndUpdate(patient._id, {
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