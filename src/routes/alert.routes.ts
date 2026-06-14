import express from "express";
import {
  createAlert,
  getPatientAlerts,
  getAlertById,
  acknowledgeAlert,
  deleteAlert,
} from "../controllers/alert.controller";
import { protect } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Alerts
 *   description: Patient alerts and acknowledgement
 *
 * /api/alerts:
 *   post:
 *     summary: Raise an alert (patient self-SOS, or caregiver for an assigned patient)
 *     tags: [Alerts]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patient: { type: string, description: Patient id (required when caregiver raises it) }
 *               type: { type: string, example: sos }
 *               message: { type: string }
 *     responses:
 *       201: { description: Alert created }
 *       403: { description: Not allowed for this patient, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.post("/", protect, authorize("patient", "caregiver", "admin"), createAlert);

/**
 * @swagger
 * /api/alerts/patient/{patientId}:
 *   get:
 *     summary: List all alerts for a patient
 *     tags: [Alerts]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of alerts }
 *       403: { description: Access denied }
 */
router.get(
  "/patient/:patientId",
  protect,
  authorize("patient", "caregiver", "admin"),
  getPatientAlerts
);

/**
 * @swagger
 * /api/alerts/{id}:
 *   get:
 *     summary: Get an alert by id
 *     tags: [Alerts]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Alert found }
 *       404: { description: Alert not found }
 *   put:
 *     summary: Acknowledge an alert (caregiver/admin)
 *     tags: [Alerts]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Alert acknowledged }
 *       404: { description: Alert not found }
 *   delete:
 *     summary: Delete an alert (caregiver/admin)
 *     tags: [Alerts]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Alert deleted }
 *       404: { description: Alert not found }
 */
router
  .route("/:id")
  .get(protect, authorize("patient", "caregiver", "admin"), getAlertById)
  .put(protect, authorize("caregiver", "admin"), acknowledgeAlert)
  .delete(protect, authorize("caregiver", "admin"), deleteAlert);

export default router;
