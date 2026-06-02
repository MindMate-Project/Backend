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
 *                 _id: "67d2a93c5f4c1f6f91361c81"
 *                 name: "Caregiver One"
 *                 email: "caregiver@example.com"
 *                 role: "caregiver"
 *                 phone: "+201234567890"
 *                 patients: []
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
 *                 _id: "67d2a93c5f4c1f6f91361c81"
 *                 name: "Updated Caregiver"
 *                 phone: "+201234567890"
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   description: Array of assigned patients (can be empty or multiple)
 *                   items:
 *                     type: object
 *             example:
 *               message: Patients retrieved successfully
 *               data:
 *                 - _id: "67d2bb8a5f4c1f6f91361c88"
 *                   name: "Patient A"
 *                   email: "patient-a@example.com"
 *                 - _id: "67d2bb8a5f4c1f6f91361c89"
 *                   name: "Patient B"
 *                   email: "patient-b@example.com"
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
 *               message: Patient info retrieved successfully
 *               data:
 *                 _id: "67d2bb8a5f4c1f6f91361c88"
 *                 name: "Patient A"
 *                 email: "patient-a@example.com"
 *                 medicalNotes: "Diabetes"
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
 *               message: Assignment request sent. Waiting for patient response
 *               data:
 *                 caregiverId: "67d2a93c5f4c1f6f91361c81"
 *                 caregiverName: "Caregiver One"
 *                 patientId: "67d2bb8a5f4c1f6f91361c88"
 *                 patientName: "Patient A"
 *                 patientEmail: "patient-a@example.com"
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     caregiver:
 *                       type: object
 *                       nullable: true
 *                     patient:
 *                       type: object
 *                       nullable: true
 *             example:
 *               message: Patient removed from caregiver successfully
 *               data:
 *                 caregiver:
 *                   _id: "67d2a93c5f4c1f6f91361c81"
 *                 patient:
 *                   _id: "67d2bb8a5f4c1f6f91361c88"
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
 *               message: Patient information updated successfully
 *               data:
 *                 _id: "67d2bb8a5f4c1f6f91361c88"
 *                 name: "Updated Patient"
 *                 medicalNotes: "Updated notes"
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