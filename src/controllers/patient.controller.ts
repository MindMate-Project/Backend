import { Request, Response } from "express";
import { Caregiver, IPatient, Patient } from "../models/User";
import asyncHandler from "express-async-handler";
import { Types } from "mongoose";
import { sendPush } from "../services/firebase.service";

export const getAllCaregivers = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;

    if (!user || user.role !== "patient") {
        res.status(403);
        throw new Error("Only patients can access this resource");
    }

    const patient = await Patient.findById(user._id);

    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }

    const caregivers = await Caregiver.find({ _id: { $in: patient.caregivers } }).select(
        "_id name email phoneNumber"
    );

    res.status(200).json({
        message: "Caregivers retrieved successfully",
        data: caregivers
    });
});

export const getCaregiverInfo = asyncHandler(async (req: Request, res: Response) => {
    const { caregiverId } = req.params;
    const user = req.user;

    if (!Types.ObjectId.isValid(caregiverId)) {
        res.status(400);
        throw new Error("Invalid caregiver ID");
    }

    if (!user || user.role !== "patient") {
        res.status(403);
        throw new Error("Only patients can access this resource");
    }

    const patient = await Patient.findById(user._id);

    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }

    const isAssignedToCaregiver = patient.caregivers.some((id: Types.ObjectId) =>
        id.equals(caregiverId)
    );

    if (!isAssignedToCaregiver) {
        res.status(403);
        throw new Error("You are not assigned to this caregiver");
    }

    const caregiver = await Caregiver.findById(caregiverId)
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

export const getPendingCaregiverRequests = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;

    if (!user || user.role !== "patient") {
        res.status(403);
        throw new Error("Only patients can access this resource");
    }

    const patient = await Patient.findById(user._id).populate(
        "pendingCaregiverRequests.caregiver",
        "name email phoneNumber"
    );

    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }

    const pendingRequests = patient.pendingCaregiverRequests.filter(
        (request) => request.status === "pending"
    );

    res.status(200).json({
        message: "Pending caregiver requests retrieved successfully",
        data: pendingRequests
    });
});

export const respondToCaregiverRequest = asyncHandler(async (req: Request, res: Response) => {
    const { caregiverId } = req.params as unknown as { caregiverId: Types.ObjectId };
    const { action } = req.body;
    const user = req.user;

    if (!Types.ObjectId.isValid(caregiverId)) {
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

    const patient = await Patient.findById(user._id);

    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }

    const request = patient.pendingCaregiverRequests.find(
        (pendingRequest) =>
            pendingRequest.caregiver.equals(caregiverId) &&
            pendingRequest.status === "pending"
    );

    if (!request) {
        res.status(404);
        throw new Error("No pending assignment request found for this caregiver");
    }

    if (action === "accept") {
        await Caregiver.findByIdAndUpdate(caregiverId, {
            $addToSet: {
                patients: {
                    patient: patient._id,
                    relationship: request.relationship,
                    connectedAt: new Date()
                }
            }
        });

        const isAlreadyAssigned = patient.caregivers.some((id: Types.ObjectId) =>
            id.equals(caregiverId)
        );

        if (!isAlreadyAssigned) {
            patient.caregivers.push(caregiverId);
        }

        patient.pendingCaregiverRequests = patient.pendingCaregiverRequests.filter(
            (req) => !req.caregiver.equals(caregiverId)
        ) as any;

        await patient.save();

        const updatedPatient = await Patient.findById(patient._id)
            .select('-password -verificationToken -passwordResetToken -passwordResetExpires -resetSessionToken');

        const updatedCaregiver = await Caregiver.findById(caregiverId)
            .select('-password -verificationToken -passwordResetToken -passwordResetExpires -resetSessionToken');

        try {
            if (updatedCaregiver?.fcmTokens?.length) {
                await sendPush(
                    updatedCaregiver.fcmTokens,
                    "Request Accepted",
                    `${patient.name} accepted your caregiver request`
                );
            }
        } catch (error) {
            console.error("Failed to send assignment accepted notification:", error);
        }

        res.status(200).json({
            message: "Caregiver request accepted successfully",
            data: {
                patient: updatedPatient,
                caregiver: updatedCaregiver
            }
        });
        return;
    }

    await Patient.findByIdAndUpdate(user._id, {
        $pull: {
            pendingCaregiverRequests: { caregiver: caregiverId }
        }
    });

    res.status(200).json({
        message: "Caregiver request rejected successfully"
    });
});

export const removeCaregiverFromPatient = asyncHandler(async (req: Request, res: Response) => {
    const { caregiverId } = req.params as unknown as { caregiverId: Types.ObjectId };
    const user = req.user;

    if (!Types.ObjectId.isValid(caregiverId)) {
        res.status(400);
        throw new Error("Invalid caregiver ID");
    }

    if (!user || user.role !== "patient") {
        res.status(403);
        throw new Error("Only patients can access this resource");
    }

    const patient = await Patient.findById(user._id);

    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }

    const isAssignedToCaregiver = patient.caregivers.some((id: Types.ObjectId) =>
        id.equals(caregiverId)
    );

    if (!isAssignedToCaregiver) {
        res.status(403);
        throw new Error("You are not assigned to this caregiver");
    }

    await Caregiver.findByIdAndUpdate(caregiverId, {
        $pull: { patients: { patient: patient._id } }
    });

    patient.caregivers = patient.caregivers.filter((id: Types.ObjectId) => !id.equals(caregiverId));

    await patient.save();

    await Patient.findByIdAndUpdate(patient._id, {
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