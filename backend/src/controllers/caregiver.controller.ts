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

    const caregiver = await Caregiver.findById(user._id).populate({
        path: "patients.patient",
        model: Patient,
        select: "name email dateOfBirth gender address phoneNumber medicalNotes device"
    });

    if (!caregiver) {
        res.status(404);
        throw new Error("Caregiver not found");
    }

    const patients = caregiver.patients.map((ref) => {
        const patient = ref.patient as any;
        return {
            patientId: patient._id,
            name: patient.name,
            email: patient.email,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            address: patient.address,
            phoneNumber: patient.phoneNumber,
            medicalNotes: patient.medicalNotes,
            device: patient.device,
            relationship: ref.relationship,
            connectedAt: ref.connectedAt
        };
    });

    res.status(200).json({
        message: "Patients retrieved successfully",
        data: patients
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
 
    const caregiverId = user._id as Types.ObjectId;
 
    const caregiver = await Caregiver.findById(caregiverId);
 
    if (!caregiver) {
        res.status(404);
        throw new Error("Caregiver not found");
    }
 
    const isAssignedToCaregiver = caregiver.patients.some((ref) =>
        ref.patient.equals(new Types.ObjectId(patientId))
    );
 
    if (!isAssignedToCaregiver) {
        res.status(403);
        throw new Error("You are not assigned to this patient");
    }
 
    const patient = await Patient
        .findById(patientId)
        .select('-password -verificationToken -passwordResetToken -passwordResetExpires -resetSessionToken');
 
    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }
 
    res.status(200).json({
        message: "Patient info retrieved successfully",
        data: patient
    });
});


export const assignPatientToCaregiver = asyncHandler(async (req: Request, res: Response) => {
    const { patientEmail, relationship } = req.body;
    const user = req.user;
 
    if (!user || user.role !== "caregiver") {
        res.status(403);
        throw new Error("Only caregivers can access this resource");
    }
 
    const validRelationships = ["son", "daughter", "sibling", "medical_staff", "other"];
    if (!relationship || !validRelationships.includes(relationship)) {
        res.status(400);
        throw new Error("A valid relationship is required");
    }
 
    const patient = await Patient.findOne({ email: patientEmail });
 
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
        existingRequest.relationship = relationship;
        existingRequest.requestedAt = new Date();
        existingRequest.respondedAt = undefined;
    } else {
        patient.pendingCaregiverRequests.push({
            caregiver: caregiverId,
            relationship,
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
            relationship,
            patientId: patient._id,
            patientName: patient.name,
            patientEmail: patient.email,
        }
    });
});

export const updatePatientInfo = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const {
        name,
        dateOfBirth,
        gender,
        address,
        phoneNumber,
        medicalNotes,
        relationship
    } = req.body;
    const user = req.user;

    if (!Types.ObjectId.isValid(patientId)) {
        res.status(400);
        throw new Error("Invalid patient ID");
    }

    if (!user || user.role !== "caregiver") {
        res.status(403);
        throw new Error("Only caregivers can access this resource");
    }

    const caregiverId = user._id as Types.ObjectId;

    const caregiver = await Caregiver.findById(caregiverId);
    if (!caregiver) {
        res.status(404);
        throw new Error("Caregiver not found");
    }

    const isAssignedToCaregiver = caregiver.patients.some((ref) =>
        ref.patient.equals(new Types.ObjectId(patientId))
    );

    if (!isAssignedToCaregiver) {
        res.status(403);
        throw new Error("You are not assigned to this patient");
    }

    const patient = await Patient.findById(patientId);

    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }

    if (relationship !== undefined) {
        const validRelationships = ["son", "daughter", "sibling", "medical_staff", "other"];
        if (!validRelationships.includes(relationship)) {
            res.status(400);
            throw new Error("Invalid relationship value");
        }

        await Caregiver.findByIdAndUpdate(
            caregiverId,
            { $set: { "patients.$[ref].relationship": relationship } },
            {
                arrayFilters: [{ "ref.patient": new Types.ObjectId(patientId) }],
                new: true
            }
        );
    }

    const updateFields: Partial<IPatient> = {};

    if (name !== undefined)        updateFields.name = name;
    if (dateOfBirth !== undefined)  updateFields.dateOfBirth = dateOfBirth;
    if (gender !== undefined)       updateFields.gender = gender;
    if (address !== undefined)      updateFields.address = address;
    if (phoneNumber !== undefined)  updateFields.phoneNumber = phoneNumber;
    if (medicalNotes !== undefined) {
        updateFields.medicalNotes = {
            diagnosis:         medicalNotes.diagnosis,
            stage:             medicalNotes.stage,
            chronicDiseases:   medicalNotes.chronicDiseases  ?? patient.medicalNotes?.chronicDiseases  ?? [],
            allergies:         medicalNotes.allergies        ?? patient.medicalNotes?.allergies        ?? [],
            currentMedication: medicalNotes.currentMedication ?? patient.medicalNotes?.currentMedication ?? [],
        };
    }

    if (Object.keys(updateFields).length === 0 && relationship === undefined) {
        res.status(400);
        throw new Error("No fields provided to update");
    }

    const updatedPatient = Object.keys(updateFields).length > 0
        ? await Patient.findByIdAndUpdate(
            patient._id,
            { $set: updateFields },
            { new: true, runValidators: true }
          ).select('-password -verificationToken -passwordResetToken -passwordResetExpires -resetSessionToken')
        : await Patient.findById(patient._id)
          .select('-password -verificationToken -passwordResetToken -passwordResetExpires -resetSessionToken');

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
 
    const caregiverId = user._id as Types.ObjectId;
 
    const caregiver = await Caregiver.findById(caregiverId);
    if (!caregiver) {
        res.status(404);
        throw new Error("Caregiver not found");
    }
 
    const isAssignedToCaregiver = caregiver.patients.some((ref) =>
        ref.patient.equals(new Types.ObjectId(patientId))
    );
 
    if (!isAssignedToCaregiver) {
        res.status(403);
        throw new Error("You are not assigned to this patient");
    }
 
    const patient = await Patient.findById(patientId);
 
    if (!patient) {
        res.status(404);
        throw new Error("Patient not found");
    }
 
    await Caregiver.findByIdAndUpdate(caregiverId, {
        $pull: { patients: { patient: new Types.ObjectId(patientId) } }
    });
 
    await Patient.findByIdAndUpdate(patientId, {
        $pull: {
            caregivers: caregiverId,
            pendingCaregiverRequests: { caregiver: caregiverId }
        }
    });
 
    res.status(200).json({
        message: "Patient removed from caregiver successfully"
    });
});