import { User, Patient, Caregiver, IMongooseBaseUser, IPatient, ICaregiver, IMedicalNotes }
from "../models/User"; import asyncHandler from "express-async-handler";
import generateToken from "../utils/generateToken";
import { sendEmail } from "../utils/sendEmail";
import crypto from "crypto";
import mongoose from "mongoose"
import { Request, Response } from 'express';

// --- Interfaces (Defined in a separate file or included here for completeness) ---

interface AuthenticatedRequest extends Request {
    user?: IMongooseBaseUser;
}

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
  role: "user" | "patient" | "caregiver";
  gender: "male" | "female";
  address: string;
  phoneNumber: string;
  dateOfBirth?: Date;
  medicalNotes?: IMedicalNotes;
  device?: { deviceId?: string };
}

interface LoginBody {
    email: string;
    password: string;
}

interface ForgotPasswordBody {
    email: string;
}
interface verifyResetPasswordBody{
    code :string
}
interface ResetPasswordBody {
    email: string,
    code: string,
    password: string,
    passwordConfirmation:string
}

// --- CONTROLLERS ---

/**
 * @desc Register a new user, patient, or caregiver
 * @route POST /api/users/register
 * @access Public
 */
export const registerUser = asyncHandler(
  async (req: Request<{}, {}, RegisterBody>, res: Response): Promise<void> => {
    const {
      name,
      password,
      role,
      gender,
      address,
      phoneNumber,
      dateOfBirth,
      medicalNotes,
      device,
    } = req.body;

    const email = req.body.email?.trim().toLowerCase();

    if (!password || password.length < 8) {
      res.status(400);
      throw new Error("Password must be at least 8 characters long.");
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
    }

    // Shared base fields for all roles
    const baseFields = {
      name,
      email,
      password,
      gender,
      address,
      phoneNumber,
    };

    let user: IMongooseBaseUser;

    if (role === "patient") {
      user = await Patient.create({
        ...baseFields,
        role: "patient",
        dateOfBirth,
        medicalNotes: medicalNotes
          ? {
              diagnosis: medicalNotes.diagnosis,
              stage: medicalNotes.stage,
              chronicDiseases: medicalNotes.chronicDiseases ?? [],
              allergies: medicalNotes.allergies ?? [],
              currentMedication: medicalNotes.currentMedication ?? [],
            }
          : undefined,
        device: {
          deviceId: device?.deviceId || undefined,
        },
      } as unknown as IPatient);

    } else if (role === "caregiver") {
      user = await Caregiver.create({
          ...baseFields,
          role: "caregiver",
          patients: [],
      } as unknown as ICaregiver);
    } else {
      user = await User.create({
        ...baseFields,
        role: "user",
      });
    }

    const verificationToken = crypto.randomBytes(20).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();

    const verificationUrl = `${process.env.BACKEND_URL}/api/auth/verify/${verificationToken}`;

    const message = `
        <h3>Hello ${user.name}</h3>
        <p>Thank you for registering. Click the link below to activate your account:</p>
        <a href="${verificationUrl}">Activate Account</a>
    `;

    try {
      await sendEmail(user.email, "Account Verification", message);

      res.status(201).json({
        message: "User registered successfully. Please check your email.",
        data: {
          user: {
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
      return;

    } catch (emailError) {
      console.error(emailError);
      res.status(500).json({
        message: "User created but failed to send verification email.",
      });
      return;
    }
  }
);

// ----------------------------------------------------------------------

/**
 * @desc Verify a user account using a token
 * @route GET /api/users/verify/:verificationToken
 * @access Public
 */
export const verifyUserAccount = asyncHandler(
  async (
    req: Request<{ verificationToken: string }>,
    res: Response
  ): Promise<void> => {

    const { verificationToken } = req.params;

    const user = await User.findOne({ verificationToken });

    if (!user) {
      res.status(400).json({
        message: "Account already verified or link expired."
      });
      return;
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({
      message: "Account verified successfully. You can now log in."
    });
    return;
  }
);

// ----------------------------------------------------------------------

/**
 * @desc Authenticate a user and get token
 * @route POST /api/auth/login
 * @access Public
 */
export const loginUser = asyncHandler(async (req: Request<{}, {}, LoginBody>, res: Response) => {
    const { password } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    // 1. Find user (Mongoose will return IMongooseBaseUser)
     const user = await User.findOne({ email }).select('+password');

    // 2. Check existence and password match
    if (user && (await user.matchPassword(password))) {
        
        if (!user.isVerified) {
            res.status(401); 
            throw new Error('Please verify your account first. Check your email for the activation link.');
        }

        const token = generateToken(user._id as mongoose.Types.ObjectId);
        res.json({
            message: "Login successful",
            token,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// ----------------------------------------------------------------------

/**
 * @desc Send password reset code to user email
 * @route POST /api/auth/forgot-password
 * @access Public
 */
export const forgotPassword = asyncHandler(async (req: Request<{}, {}, ForgotPasswordBody>, res: Response) => {
    const email = req.body.email?.trim().toLowerCase();

    const genericMessage =
        "If an account exists for that email, a password reset code has been sent.";

    const user = await User.findOne({ email });

    if (!user) {
        res.status(200).json({ message: genericMessage });
        return;
    }

    // 1. Generate a random 6-digit reset code (for user)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Hash the reset code and set it on the user model (for database comparison)
    user.passwordResetToken = crypto
        .createHash("sha256")
        .update(resetCode)
        .digest("hex");

    // 3. Set an expiration time (10 minutes)
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); 

    await user.save();

    // 4. Send the code to the user's email
    try {
        const message = `
            <h3>Hello ${user.name}</h3>
            <p>You requested a password reset. Please use the code below to reset your password.</p>
            <h2>${resetCode}</h2>
            <p>This code will expire in 10 minutes.</p>
        `;
        await sendEmail(user.email, "Password Reset Code", message);

        res.status(200).json({
            message: genericMessage,
        });

    } catch (error) {
        // Clear the token fields if email fails
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        console.error(error);
        res.status(500);
        throw new Error("Failed to send the password reset email.");
    }
});

// ----------------------------------------------------------------------

/**
 * @desc Reset user password using the code
 * @route POST /api/auth/reset-password
 * @access Public
 */
export const verifyResetPassword = asyncHandler(async (req: Request<{},{},verifyResetPasswordBody>, res: Response) => {
    const {code}=req.body;
     const hashedCode = crypto
        .createHash("sha256")
        .update(code)
        .digest("hex");
      const user = await User.findOne({
      passwordResetToken: hashedCode,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error("Invalid or expired reset code.");
    }

    res.status(200).json({
      message: "Reset code verified successfully.",
    });
  
     

})
export const resetPassword = asyncHandler(async (req: Request<{}, {}, ResetPasswordBody>, res: Response) => {
    const { code, password, passwordConfirmation } = req.body;
    const email = req.body.email?.trim().toLowerCase();
     if (!password || password !== passwordConfirmation) {
      res.status(400);
      throw new Error("Passwords do not match");
    }

    if (password.length < 8) {
      res.status(400);
      throw new Error("Password must be at least 8 characters long.");
    }

    if (!code) {
      res.status(400);
      throw new Error("Reset code is required");
    }

    const hashedCode = crypto
        .createHash("sha256")
        .update(code)
        .digest("hex");

    const user = await User.findOne({
        email,
        passwordResetToken: hashedCode,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400);
        throw new Error("Invalid or expired reset code.");
    }

    // Set new password (pre-save hook will hash it)
    user.password = password; 

    // Clear the reset token fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    // Log the user in immediately
    const token = generateToken(user._id as mongoose.Types.ObjectId);

    res.status(200).json({
        message: "Password has been reset successfully.",
        token,
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});