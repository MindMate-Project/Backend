import { Request, Response } from "express";
import { Caregiver, IPatient, Patient } from "../models/User";
import asyncHandler from "express-async-handler";
import { Types } from "mongoose";

export const deviceLocation = asyncHandler(async (req: Request, res: Response) => {
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
        throw new Error("This patient not found");
    }

    if (!patient.device || !patient.device.deviceId) {
        res.status(404);
        throw new Error("This patient does not have a device assigned");
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
        message: "device found successfuly",
        data: {
            patientId: patient._id,
            name: patient.name,
            device: patient.device,
        }
    });
});


export const assignDevice = asyncHandler(async (req: Request, res: Response) => {
    const { deviceId, patientEmail } = req.body;
    const user = req.user;

    if (!user || user.role !== "caregiver") {
        res.status(403);
        throw new Error("Only caregivers can access this resource");
    }

    if (!deviceId || !patientEmail) {
        res.status(400);
        throw new Error("deviceId and patientEmail are required");
    }

    const patient = await Patient.findOne({ email: patientEmail.trim().toLowerCase() });

    if (!patient) {
        res.status(401);
        throw new Error("User not found");
    }

    // Exclude the patient's own record — re-assigning a device they already
    // have should not be treated as a conflict with "another" patient.
    const usedDevice = await Patient.findOne({
        "device.deviceId": deviceId,
        _id: { $ne: patient._id },
    });

    if (usedDevice) {
        res.status(409);
        throw new Error("This device is used by another patient");
    }

    const caregiverId = user._id as Types.ObjectId;

    const isAssignedToCaregiver = patient.caregivers.some((id: Types.ObjectId) =>
        id.equals(caregiverId)
    );

    if (!isAssignedToCaregiver) {
        res.status(403);
        throw new Error("You are not assigned to this patient");
    }

    patient.device.deviceId = deviceId;
    await patient.save();

    res.status(200).json({
        message: "device assigned to patient successfuly",
        data: patient
    })
});

export const removeDevice = asyncHandler(async (req: Request, res: Response) => {
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

    if (!patient.device || !patient.device.deviceId) {
        res.status(404);
        throw new Error("This patient does not have a device assigned");
    }

    const caregiverId = user._id as Types.ObjectId;

    const isAssignedToCaregiver = patient.caregivers.some((id: Types.ObjectId) =>
        id.equals(caregiverId)
    );

    if (!isAssignedToCaregiver) {
        res.status(403);
        throw new Error("You are not assigned to this patient");
    }

    // Clear identifying/location fields and free the deviceId for reassignment
    // (assignDevice rejects a deviceId that's still set on any patient).
    await Patient.findByIdAndUpdate(patientId, {
        $unset: {
            "device.deviceId": "",
            "device.latitude": "",
            "device.longitude": "",
            "device.battery": "",
        },
        $set: {
            "device.outOfBoundsAlertSent": false,
            "device.offlineAlertSent": false,
            "device.timestamp": new Date(),
        },
    });

    res.status(200).json({
        message: "Device removed from patient successfully"
    });
});

export const getSafeZone = asyncHandler(async (req: Request, res: Response) => {
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

    // Mongoose materializes an empty {} for an unset nested-schema path (rather
    // than leaving it undefined), so check a real field instead of truthiness.
    const hasZone = patient.homeLocation?.radiusMeters != null;

    res.status(200).json({
        message: "Safe zone retrieved successfully",
        data: {
            patientId: patient._id,
            homeLocation: hasZone ? patient.homeLocation : null,
        }
    });
});

export const setSafeZone = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { lat, lng, radiusMeters } = req.body;
    const user = req.user;

    if (!Types.ObjectId.isValid(patientId)) {
        res.status(400);
        throw new Error("Invalid patient ID");
    }

    if (!user || user.role !== "caregiver") {
        res.status(403);
        throw new Error("Only caregivers can access this resource");
    }

    const latNum = Number(lat);
    const lngNum = Number(lng);
    const radiusNum = Number(radiusMeters);

    if (
        !Number.isFinite(latNum) || latNum < -90 || latNum > 90 ||
        !Number.isFinite(lngNum) || lngNum < -180 || lngNum > 180 ||
        !Number.isFinite(radiusNum) || radiusNum <= 0
    ) {
        res.status(400);
        throw new Error("lat (-90..90), lng (-180..180) and a positive radiusMeters are required");
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

    patient.homeLocation = { lat: latNum, lng: lngNum, radiusMeters: radiusNum };
    // Re-arm the exit alert so a newly (re)configured zone is evaluated fresh
    // on the next location update, instead of inheriting a stale flag from
    // whatever zone (or lack of one) was in effect before.
    patient.device.outOfBoundsAlertSent = false;
    await patient.save();

    res.status(200).json({
        message: "Safe zone updated successfully",
        data: {
            patientId: patient._id,
            homeLocation: patient.homeLocation,
        }
    });
});

export const removeSafeZone = asyncHandler(async (req: Request, res: Response) => {
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

    await Patient.findByIdAndUpdate(patientId, {
        $unset: { homeLocation: "" },
        $set: { "device.outOfBoundsAlertSent": false },
    });

    res.status(200).json({
        message: "Safe zone removed successfully"
    });
});