"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.verifyResetPassword = exports.forgotPassword = exports.loginUser = exports.verifyUserAccount = exports.registerUser = void 0;
const User_1 = require("../models/User");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const generateToken_1 = __importDefault(require("../utils/generateToken"));
const sendEmail_1 = require("../utils/sendEmail");
const crypto_1 = __importDefault(require("crypto"));
// --- CONTROLLERS ---
/**
 * @desc Register a new user, patient, or caregiver
 * @route POST /api/users/register
 * @access Public
 */
exports.registerUser = (0, express_async_handler_1.default)(async (req, res) => {
    const { name, email, password, role, gender, address, phoneNumber, dateOfBirth, medicalNotes, device, } = req.body;
    if (!password) {
        res.status(400);
        throw new Error("Password is required for registration.");
    }
    const userExists = await User_1.User.findOne({ email });
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
    let user;
    if (role === "patient") {
        user = await User_1.Patient.create({
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
        });
    }
    else if (role === "caregiver") {
        user = await User_1.Caregiver.create({
            ...baseFields,
            role: "caregiver",
            patients: [],
        });
    }
    else {
        user = await User_1.User.create({
            ...baseFields,
            role: "user",
        });
    }
    const verificationToken = crypto_1.default.randomBytes(20).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();
    const verificationUrl = `${process.env.BACKEND_URL}/api/auth/verify/${verificationToken}`;
    const message = `
        <h3>Hello ${user.name}</h3>
        <p>Thank you for registering. Click the link below to activate your account:</p>
        <a href="${verificationUrl}">Activate Account</a>
    `;
    try {
        await (0, sendEmail_1.sendEmail)(user.email, "Account Verification", message);
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
    }
    catch (emailError) {
        console.error(emailError);
        res.status(500).json({
            message: "User created but failed to send verification email.",
        });
        return;
    }
});
// ----------------------------------------------------------------------
/**
 * @desc Verify a user account using a token
 * @route GET /api/users/verify/:verificationToken
 * @access Public
 */
exports.verifyUserAccount = (0, express_async_handler_1.default)(async (req, res) => {
    const { verificationToken } = req.params;
    const user = await User_1.User.findOne({ verificationToken });
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
});
// ----------------------------------------------------------------------
/**
 * @desc Authenticate a user and get token
 * @route POST /api/auth/login
 * @access Public
 */
exports.loginUser = (0, express_async_handler_1.default)(async (req, res) => {
    const { email, password } = req.body;
    // 1. Find user (Mongoose will return IMongooseBaseUser)
    const user = await User_1.User.findOne({ email }).select('+password');
    // 2. Check existence and password match
    if (user && (await user.matchPassword(password))) {
        if (!user.isVerified) {
            res.status(401);
            throw new Error('Please verify your account first. Check your email for the activation link.');
        }
        const token = (0, generateToken_1.default)(user._id);
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
    }
    else {
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
exports.forgotPassword = (0, express_async_handler_1.default)(async (req, res) => {
    const { email } = req.body;
    const user = await User_1.User.findOne({ email });
    if (!user) {
        res.status(404);
        throw new Error("There is no user with that email address");
    }
    // 1. Generate a random 6-digit reset code (for user)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    // 2. Hash the reset code and set it on the user model (for database comparison)
    user.passwordResetToken = crypto_1.default
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
        await (0, sendEmail_1.sendEmail)(user.email, "Password Reset Code", message);
        res.status(200).json({
            message: "Password reset code sent to your email.",
        });
    }
    catch (error) {
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
exports.verifyResetPassword = (0, express_async_handler_1.default)(async (req, res) => {
    const { code } = req.body;
    const hashedCode = crypto_1.default
        .createHash("sha256")
        .update(code)
        .digest("hex");
    const user = await User_1.User.findOne({
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
});
exports.resetPassword = (0, express_async_handler_1.default)(async (req, res) => {
    const { email, password, passwordConfirmation } = req.body;
    if (!password || password !== passwordConfirmation) {
        res.status(400);
        throw new Error("Passwords do not match");
    }
    // 1. Find the user by email, matching token, and non-expired time
    const user = await User_1.User.findOne({
        email,
        passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
        res.status(400);
        throw new Error("Reset session expired. Try again.");
    }
    // Set new password (pre-save hook will hash it)
    user.password = password;
    // Clear the reset token fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    // Log the user in immediately
    const token = (0, generateToken_1.default)(user._id);
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
