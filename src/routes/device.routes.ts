import { Router } from "express";
import { authorize } from "../middlewares/authorize.middleware";
import { protect } from "../middlewares/auth.middleware";
import { deviceLocation, assignDevice } from "../controllers/device.controller";

const router = Router();

/**
 * @swagger
 * /api/device/location/{patientId}:
 *   get:
 *     summary: Get patient device location
 *     tags: [Device]
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
 *         description: Device location retrieved successfully
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
 *               message: device found successfuly
 *               data:
 *                 _id: "67d2bb8a5f4c1f6f91361c88"
 *                 name: "Patient A"
 *                 device:
 *                   deviceId: "ESP32-001"
 *                 location:
 *                   lat: 30.0444
 *                   lng: 31.2357
 *       400:
 *         description: Invalid patient ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Device or patient not found
 */
router.get(
    '/location/:patientId',
    protect,
    authorize('caregiver'),
    deviceLocation
);

/**
 * @swagger
 * /api/device/assign-device:
 *   post:
 *     summary: Assign device to patient
 *     tags: [Device]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [deviceId, patientEmail]
 *             properties:
 *               deviceId:
 *                 type: string
 *               patientEmail:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Device assigned successfully
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
 *               message: device assigned to patient successfuly
 *               data:
 *                 _id: "67d2bb8a5f4c1f6f91361c88"
 *                 email: "patient-a@example.com"
 *                 device:
 *                   deviceId: "ESP32-001"
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Patient or device not found
 *       409:
 *         description: Device already assigned to another patient
 */
router.post(
    '/assign-device',
    protect,
    authorize('caregiver'),
    assignDevice
);

export default router;