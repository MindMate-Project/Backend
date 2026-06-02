import { Request, Response } from "express";
import { Patient, IPatient, Caregiver, ICaregiver, User } from "../models/User";
import asyncHandler from "express-async-handler";
import cloudinary from "../config/cloudinary";

// ----------------------------------------------------------------------

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

// ----------------------------------------------------------------------

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

// ----------------------------------------------------------------------

/**
 * @desc Upload or update profile picture
 * @route POST /api/users/profile-picture
 * @access Private (all roles)
 */
export const uploadProfilePicture = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const file = req.file as any;

    if (!user) {
        res.status(401);
        throw new Error("Not authenticated");
    }

    if (!file) {
        res.status(400);
        throw new Error("No image file provided");
    }

    // Delete old picture from Cloudinary if it exists
    const existingUser = await User.findById(user._id) as any;
    if (existingUser?.profilePicture_public_id) {
        await cloudinary.uploader.destroy(existingUser.profilePicture_public_id, {
            resource_type: "image",
        });
    }

    const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
            profilePicture: file.path,
            profilePicture_public_id: file.filename,
        },
        { new: true }
    ).select("-password -verificationToken -passwordResetToken -passwordResetExpires -resetSessionToken");

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
export const deleteProfilePicture = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;

    if (!user) {
        res.status(401);
        throw new Error("Not authenticated");
    }

    const existingUser = await User.findById(user._id) as any;

    if (!existingUser) {
        res.status(404);
        throw new Error("User not found");
    }

    if (!existingUser.profilePicture_public_id) {
        res.status(400);
        throw new Error("No profile picture to delete");
    }

    await cloudinary.uploader.destroy(existingUser.profilePicture_public_id, {
        resource_type: "image",
    });

    await User.findByIdAndUpdate(user._id, {
        profilePicture: null,
        profilePicture_public_id: null,
    });

    res.status(200).json({
        message: "Profile picture deleted successfully",
    });
});