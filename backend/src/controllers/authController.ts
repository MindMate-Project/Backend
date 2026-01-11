import { User, Patient, Caregiver, IMongooseBaseUser, IPatient, ICaregiver } from "../models/User";
import asyncHandler from "express-async-handler";
import generateToken from "../utils/generateToken";
// import { sendEmail } from "../utils/sendEmail"; // مؤقتًا معلّق
import crypto from "crypto";
import mongoose from "mongoose"
import { Request, Response, NextFunction } from 'express';

// --- Interfaces (Defined in a separate file or included here for completeness) ---

interface AuthenticatedRequest extends Request {
    user?: IMongooseBaseUser;
}

interface RegisterBody {
    name: string;
    email: string;
    password?: string;
    role: "user" | "patient" | "caregiver";
    relation?: ICaregiver['relation'];
    phone?: string;
    dateOfBirth?: Date;
    medicalNotes?: string;
}

interface LoginBody {
    email: string;
    password: string;
}

interface ForgotPasswordBody {
    email: string;
}

interface ResetPasswordBody {
    email: string;
    code: string;
    password: string;
}

// --- CONTROLLERS ---

/**
 * @desc Register a new user, patient, or caregiver
 * @route POST /api/users/register
 * @access Public
 */
export const registerUser = asyncHandler(async (req: Request<{}, {}, RegisterBody>, res: Response) => {
    const { name, email, password, role, relation, phone, dateOfBirth, medicalNotes } = req.body;

    if (!password) {
        res.status(400);
        throw new Error("Password is required for registration.");
    }

    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error("User already exists");
    }

    let user: IMongooseBaseUser;

    // Use Discriminators to create the specific user type
    if (role === "patient") {
        user = await Patient.create({ name, email, password, dateOfBirth, medicalNotes, role: 'patient' } as IPatient);
    } else if (role === "caregiver") {
        user = await Caregiver.create({ name, email, password, relation, phone, role: 'caregiver' } as ICaregiver);
    } else {
        user = await User.create({ name, email, password, role: 'user' });
    }

    // Generate a random verification token
    const verificationToken = crypto.randomBytes(20).toString("hex");

    // Store the verificationToken
    user.verificationToken = verificationToken;
    await user.save(); 

    // --- مؤقتًا تم تعطيل إرسال الإيميل ---
    /*
    const verificationUrl = `${process.env.BACKEND_URL}/api/users/verify/${verificationToken}`;
    const message = `
        <h3>Hello ${user.name}</h3>
        <p>Thank you for registering. Click the link below to activate your account:</p>
        <a href="${verificationUrl}">Activate Account</a>
    `;
    
    try {
        await sendEmail(user.email, "Account Verification", message);

        res.status(201).json({
            message: "User registered successfully. Please check your email to activate your account.",
            data: { user: { name: user.name, email: user.email, role: user.role } }
        });
    } catch (emailError) {
        console.error(emailError);
        res.status(500);
        throw new Error("User registered, but email verification failed to send.");
    }
    */

    // الرد المباشر للاختبار بدون إيميل
    res.status(201).json({
        message: "User registered successfully. (Email sending skipped for testing)",
        data: { 
            user: { 
                name: user.name, 
                email: user.email, 
                role: user.role, 
                verificationToken: user.verificationToken // ممكن تستخدمه لتفعيل الحساب
            } 
        }
    });
});

// ----------------------------------------------------------------------

/**
 * @desc Verify a user account using a token
 * @route GET /api/users/verify/:verificationToken
 * @access Public
 */
export const verifyUserAccount = asyncHandler(async (req: Request<{ verificationToken: string }>, res: Response) => {
    const { verificationToken } = req.params;

    // Find user by token
    const user = await User.findOne({ verificationToken });

    if (!user) {
        res.status(400);
        throw new Error("Invalid verification token");
    }

    // Verify user
    user.isVerified = true;
    user.verificationToken = undefined; 
    await user.save();

    res.status(200).json({ message: "Account verified successfully. You can now log in." });
});

// ----------------------------------------------------------------------

/**
 * @desc Authenticate a user and get token
 * @route POST /api/users/login
 * @access Public
 */
export const loginUser = asyncHandler(async (req: Request<{}, {}, LoginBody>, res: Response) => {
    const { email, password } = req.body;

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
 * @route POST /api/users/forgot-password
 * @access Public
 */
export const forgotPassword = asyncHandler(async (req: Request<{}, {}, ForgotPasswordBody>, res: Response) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error("There is no user with that email address");
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

    // --- مؤقتًا تم تعطيل إرسال الإيميل ---
    /*
    try {
        const message = `
            <h3>Hello ${user.name}</h3>
            <p>You requested a password reset. Please use the code below to reset your password.</p>
            <h2>${resetCode}</h2>
            <p>This code will expire in 10 minutes.</p>
        `;
        await sendEmail(user.email, "Password Reset Code", message);

        res.status(200).json({
            message: "Password reset code sent to your email.",
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
    */

    // الرد المباشر للاختبار بدون إيميل
    res.status(200).json({
        message: "Password reset code generated (Email sending skipped for testing).",
        data: { 
            resetCode // ترجع الكود مباشرة للاختبار في Postman
        }
    });
});

// ----------------------------------------------------------------------

/**
 * @desc Reset user password using the code
 * @route POST /api/users/reset-password
 * @access Public
 */
export const resetPassword = asyncHandler(async (req: Request<{}, {}, ResetPasswordBody>, res: Response) => {
    const { email, code, password } = req.body;

    // 1. Hash the incoming code from the user
    const hashedCode = crypto
        .createHash("sha256")
        .update(code)
        .digest("hex");

    // 2. Find the user by email, matching token, and non-expired time
    const user = await User.findOne({
        email,
        passwordResetToken: hashedCode,
        passwordResetExpires: { $gt: Date.now() }, 
    });

    if (!user) {
        res.status(400);
        throw new Error("Invalid code or code has expired.");
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
