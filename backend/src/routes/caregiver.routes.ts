import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import {
    getAllPatients,
    getPatientInfo,
    assignPatientToCaregiver,
    removePatientFromCaregiver,
    updatePatientInfo
} from "../controllers/caregiver.controller";
import {
    getUserInfo,
    updateUserInfo
} from "../controllers/user.controller";

const router = Router();

/**
 * @swagger
 * /api/caregiver:
 *   get:
 *     summary: Get caregiver profile
 *     tags: [Caregiver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Caregiver profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    '/',
    protect,
    authorize('caregiver'),
    getUserInfo
);

/**
 * @swagger
 * /api/caregiver/update:
 *   patch:
 *     summary: Update caregiver profile
 *     tags: [Caregiver]
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
 *               relation:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Caregiver profile updated successfully
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
    authorize('caregiver'),
    updateUserInfo
)

/**
 * @swagger
 * /api/caregiver/patients:
 *   get:
 *     summary: Get all patients assigned to caregiver
 *     tags: [Caregiver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patients retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    '/patients',
    protect,
    authorize('caregiver'),
    getAllPatients
);

/**
 * @swagger
 * /api/caregiver/patients/{patientId}:
 *   get:
 *     summary: Get a specific assigned patient information
 *     tags: [Caregiver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Patient info retrieved successfully
 *       400:
 *         description: Invalid patient ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Patient not found
 */
router.get(
    '/patients/:patientId',
    protect,
    authorize('caregiver'),
    getPatientInfo
);

/**
 * @swagger
 * /api/caregiver/patients/assignment-request:
 *   post:
 *     summary: Send patient assignment request
 *     tags: [Caregiver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientEmail]
 *             properties:
 *               patientEmail:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Assignment request sent
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Patient not found
 *       409:
 *         description: Assignment request already pending
 */
router.post(
    '/patients/assignment-request',
    protect,
    authorize('caregiver'),
    assignPatientToCaregiver
);


/**
 * @swagger
 * /api/caregiver/patients/remove/{patientId}:
 *   delete:
 *     summary: Remove patient from caregiver
 *     tags: [Caregiver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Patient removed from caregiver successfully
 *       400:
 *         description: Invalid patient ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Patient not found
 */
router.delete(
    '/patients/remove/:patientId',
    protect,
    authorize('caregiver'),
    removePatientFromCaregiver
);

/**
 * @swagger
 * /api/caregiver/patients/update/{patientId}:
 *   patch:
 *     summary: Update assigned patient information
 *     tags: [Caregiver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               medicalNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Patient information updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Patient not found
 */
router.patch(
    '/patients/update/:patientId',
    protect,
    authorize('caregiver'),
    updatePatientInfo
);

export default router;