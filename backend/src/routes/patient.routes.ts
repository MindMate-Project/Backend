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