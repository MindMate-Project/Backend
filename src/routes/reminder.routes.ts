import express from "express";
import {
  createReminder,
  getPatientReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
  deleteReminderSeries,
} from "../controllers/reminder.controller";

import { protect } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reminders
 *   description: APIs for managing reminders
 *
 * components:
 *   schemas:
 *     BaseReminder:
 *       type: object
 *       required:
 *         - type
 *         - patient
 *         - caregiver
 *         - scheduledTime
 *       properties:
 *         _id:
 *           type: string
 *           description: Reminder ID
 *         type:
 *           type: string
 *           enum: [appointment, medication]
 *           description: Reminder type
 *         patient:
 *           type: string
 *           description: Patient ID
 *         caregiver:
 *           type: string
 *           description: Caregiver ID
 *         scheduledTime:
 *           type: string
 *           format: date-time
 *           description: Reminder scheduled time
 *         isSent:
 *           type: boolean
 *           description: Whether the reminder was sent
 *
 *     AppointmentReminder:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseReminder'
 *         - type: object
 *           required:
 *             - doctorName
 *             - specialty
 *             - location
 *             - appointmentType
 *             - appointmentDate
 *           properties:
 *             doctorName:
 *               type: string
 *             specialty:
 *               type: string
 *             location:
 *               type: string
 *             appointmentType:
 *               type: string
 *               enum: [consultation, follow-up, scan, lab]
 *             appointmentDate:
 *               type: string
 *               format: date-time
 *             notes:
 *               type: string
 *
 *     MedicationReminder:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseReminder'
 *         - type: object
 *           required:
 *             - medicineName
 *             - dosage
 *             - form
 *             - frequency
 *             - timesPerDay
 *             - startDate
 *           properties:
 *             medicineName:
 *               type: string
 *             dosage:
 *               type: string
 *             form:
 *               type: string
 *               enum: [tablet, capsule, syrup, injection]
 *             frequency:
 *               type: string
 *               enum: [once, daily, weekly]
 *             timesPerDay:
 *               type: number
 *             startDate:
 *               type: string
 *               format: date-time
 *             endDate:
 *               type: string
 *               format: date-time
 */

/* ===============================
   ✅ Create Reminder
================================ */
/**
 * @swagger
 * /api/reminders:
 *   post:
 *     summary: Create a new reminder (appointment or medication)
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/AppointmentReminder'
 *               - $ref: '#/components/schemas/MedicationReminder'
 *     responses:
 *       201:
 *         description: Reminder(s) created successfully
 *       400:
 *         description: Missing or invalid fields
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  protect,
  authorize("caregiver", "admin"),
  createReminder
);

/* ===============================
   ✅ Get All Reminders For Patient
================================ */
/**
 * @swagger
 * /api/reminders/patient/{patientId}:
 *   get:
 *     summary: Get all reminders for a patient
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: List of patient reminders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 oneOf:
 *                   - $ref: '#/components/schemas/AppointmentReminder'
 *                   - $ref: '#/components/schemas/MedicationReminder'
 *       500:
 *         description: Server error
 */
router.get(
  "/patient/:patientId",
  protect,
  authorize("caregiver", "patient", "admin"),
  getPatientReminders
);

/* ===============================
   ✅ Single Reminder Operations
================================ */
/**
 * @swagger
 * /api/reminders/{id}:
 *   get:
 *     summary: Get a reminder by ID
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reminder ID
 *     responses:
 *       200:
 *         description: Reminder found
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/AppointmentReminder'
 *                 - $ref: '#/components/schemas/MedicationReminder'
 *       404:
 *         description: Reminder not found
 *
 *   put:
 *     summary: Update a reminder
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scheduledTime:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               dosage:
 *                 type: string
 *               medicineName:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reminder updated successfully
 *       404:
 *         description: Reminder not found
 *
 *   delete:
 *     summary: Delete a reminder
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reminder deleted successfully
 *       404:
 *         description: Reminder not found
 */
/* ===============================
   ✅ Delete a whole reminder series
   NOTE: must be declared before "/:id" so "series" is not parsed as an id.
================================ */
/**
 * @swagger
 * /api/reminders/series:
 *   delete:
 *     summary: Delete every reminder sharing a groupId (a whole schedule)
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: groupId shared by all rows of the schedule
 *     responses:
 *       200:
 *         description: Series deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deletedCount:
 *                   type: integer
 *       400:
 *         description: groupId is required
 *       404:
 *         description: Reminder series not found
 */
router.delete(
  "/series",
  protect,
  authorize("caregiver", "admin"),
  deleteReminderSeries
);

router
  .route("/:id")
  .get(protect, authorize("caregiver", "patient", "admin"), getReminderById)
  .put(protect, authorize("caregiver", "admin"), updateReminder)
  .delete(protect, authorize("caregiver", "admin"), deleteReminder);

export default router;