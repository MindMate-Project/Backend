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
 *             required: [patientId, serialNumber]
 *             properties:
 *               patientId:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device assigned successfully
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Patient or device not found
 */
router.post(
    '/assign-device',
    protect,
    authorize('caregiver'),
    assignDevice
);

export default router;