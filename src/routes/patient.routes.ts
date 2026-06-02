import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import {
    getAllCaregivers,
    getCaregiverInfo,
    getPendingCaregiverRequests,
    respondToCaregiverRequest,
    removeCaregiverFromPatient
} from "../controllers/patient.controller";
import {
    getUserInfo,
    updateUserInfo
} from "../controllers/user.controller";

const router = Router();

/**
 * @swagger
 * /api/patient:
 *   get:
 *     summary: Get patient profile
 *     tags: [Patient]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patient profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *             example:
 *               message: User info retrieved successfully
 *               data:
 *                 _id: "67d2bb8a5f4c1f6f91361c88"
 *                 name: "Patient A"
 *                 email: "patient-a@example.com"
 *                 role: "patient"
 *                 caregivers: []
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    '/',
    protect,
    authorize('patient'),
    getUserInfo
);

/**
 * @swagger
 * /api/patient/update:
 *   patch:
 *     summary: Update patient profile
 *     tags: [Patient]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               medicalNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Patient profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *             example:
 *               message: User info updated successfully
 *               data:
 *                 _id: "67d2bb8a5f4c1f6f91361c88"
 *                 name: "Patient A Updated"
 *                 medicalNotes: "Needs daily medication"
 *       400:
 *         description: Invalid request payload
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch(
    '/update',
    protect,
    authorize('patient'),
    updateUserInfo
)

/**
 * @swagger
 * /api/patient/caregivers:
 *   get:
 *     summary: Get all caregivers assigned to patient
 *     tags: [Patient]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Caregivers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   description: Array of assigned caregivers (can be empty or multiple)
 *                   items:
 *                     type: object
 *             example:
 *               message: Caregivers retrieved successfully
 *               data:
 *                 - _id: "67d2a93c5f4c1f6f91361c81"
 *                   name: "Caregiver One"
 *                   email: "caregiver1@example.com"
 *                 - _id: "67d2a93c5f4c1f6f91361c82"
 *                   name: "Caregiver Two"
 *                   email: "caregiver2@example.com"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    '/caregivers',
    protect,
    authorize('patient'),
    getAllCaregivers
);

/**
 * @swagger
 * /api/patient/caregivers/{caregiverId}:
 *   get:
 *     summary: Get specific caregiver info for assigned caregiver
 *     tags: [Patient]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caregiverId
 *         required: true
 *         schema:
 *           type: string
 *         description: Caregiver MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Caregiver info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *             example:
 *               message: Caregiver info retrieved successfully
 *               data:
 *                 _id: "67d2a93c5f4c1f6f91361c81"
 *                 name: "Caregiver One"
 *                 email: "caregiver1@example.com"
 *                 phone: "+201111111111"
 *       400:
 *         description: Invalid caregiver ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Caregiver not found
 */
router.get(
    '/caregivers/:caregiverId',
    protect,
    authorize('patient'),
    getCaregiverInfo
);

/**
 * @swagger
 * /api/patient/assignment-requests:
 *   get:
 *     summary: Get pending caregiver assignment requests
 *     tags: [Patient]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   description: Array of pending assignment requests (can be empty or multiple)
 *                   items:
 *                     type: object
 *             example:
 *               message: Pending caregiver requests retrieved successfully
 *               data:
 *                 - caregiver:
 *                     _id: "67d2a93c5f4c1f6f91361c81"
 *                     name: "Caregiver One"
 *                     email: "caregiver1@example.com"
 *                   status: "pending"
 *                   requestedAt: "2026-03-09T10:15:00.000Z"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    '/assignment-requests',
    protect,
    authorize('patient'),
    getPendingCaregiverRequests
);

/**
 * @swagger
 * /api/patient/assignment-requests/respond/{caregiverId}:
 *   post:
 *     summary: Accept or reject caregiver assignment request
 *     tags: [Patient]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caregiverId
 *         required: true
 *         schema:
 *           type: string
 *         description: Caregiver MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [accept, reject]
 *     responses:
 *       200:
 *         description: Request handled successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     data:
 *                       type: object
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *             examples:
 *               accepted:
 *                 summary: When action is accept
 *                 value:
 *                   message: Caregiver request accepted successfully
 *                   data:
 *                     patient:
 *                       _id: "67d2bb8a5f4c1f6f91361c88"
 *                     caregiver:
 *                       _id: "67d2a93c5f4c1f6f91361c81"
 *               rejected:
 *                 summary: When action is reject
 *                 value:
 *                   message: Caregiver request rejected successfully
 *       400:
 *         description: Invalid caregiver ID or action
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Pending request or caregiver not found
 */
router.post(
    '/assignment-requests/respond/:caregiverId',
    protect,
    authorize('patient'),
    respondToCaregiverRequest
);

/**
 * @swagger
 * /api/patient/caregivers/remove/{caregiverId}:
 *   delete:
 *     summary: Remove caregiver from patient
 *     tags: [Patient]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caregiverId
 *         required: true
 *         schema:
 *           type: string
 *         description: Caregiver MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Caregiver removed from patient successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: Caregiver removed from patient successfully
 *       400:
 *         description: Invalid caregiver ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Caregiver or patient not found
 */
router.delete(
    '/caregivers/remove/:caregiverId',
    protect,
    authorize('patient'),
    removeCaregiverFromPatient
)

export default router;