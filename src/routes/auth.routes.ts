import express, { Router } from "express";
import { registerUser, loginUser,verifyUserAccount,forgotPassword,verifyResetPassword,resetPassword} from "../controllers/auth.controller";
const router : Router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *               role: { type: string, enum: [patient, caregiver] }
 *               phoneNumber: { type: string }
 *               gender: { type: string, enum: [male, female] }
 *               dateOfBirth: { type: string, format: date }
 *               address: { type: string }
 *     responses:
 *       201:
 *         description: Account created; verification email sent
 *       400:
 *         description: Validation error or email already in use
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/register",registerUser );

/**
 * @swagger
 * /api/auth/verify/{verificationToken}:
 *   get:
 *     summary: Verify a user's email address
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: verificationToken
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Account verified }
 *       400: { description: Invalid or expired token }
 */
router.get('/verify/:verificationToken', verifyUserAccount);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/login", loginUser);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password-reset code by email
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: If the account exists, a reset code was emailed (generic for privacy)
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /api/auth/verify-reset-password:
 *   post:
 *     summary: Verify a password-reset code
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string }
 *     responses:
 *       200: { description: Code verified }
 *       400: { description: Invalid or expired code }
 */
router.post("/verify-reset-password", verifyResetPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Set a new password using a verified reset code
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, password, passwordConfirmation]
 *             properties:
 *               email: { type: string, format: email }
 *               code: { type: string }
 *               password: { type: string, format: password }
 *               passwordConfirmation: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Password reset; returns a fresh token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400:
 *         description: Invalid code or mismatched passwords
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/reset-password', resetPassword);
export default router;
