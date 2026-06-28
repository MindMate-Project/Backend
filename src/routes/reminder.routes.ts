import express from "express";
import {
  createReminder,
  getPatientReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
  deleteReminderSeries,
  acknowledgeReminder,
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
 *         isAcknowledged:
 *           type: boolean
 *           description: Set by the patient via PATCH /api/reminders/{id}/acknowledge
 *         groupId:
 *           type: string
 *           description: Shared by every row created from one request (a medication's doses, or an appointment plus its lead-time reminders); used to delete the whole schedule via DELETE /api/reminders/series
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
 *         description: Missing or invalid fields, or scheduledTime is in the past
 *       403:
 *         description: Not allowed to create reminders for this patient
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
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *         description: Only reminders scheduled at/after this time
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *         description: Only reminders scheduled at/before this time
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *         description: Defaults to 50 if not provided
 *       - in: query
 *         name: skip
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: >
 *           List of patient reminders (plain array), capped at 50 rows unless a larger limit is requested.
 *           Lighter than the AppointmentReminder/MedicationReminder schemas used elsewhere — see the
 *           properties below for exactly what's included here.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id: { type: string }
 *                   type: { type: string, enum: [appointment, medication] }
 *                   patient: { type: string, description: Plain patient id (already known from the URL, so not populated) }
 *                   caregiver:
 *                     type: object
 *                     description: Populated with just the fields needed to display who set the reminder
 *                     properties:
 *                       _id: { type: string }
 *                       name: { type: string }
 *                   scheduledTime: { type: string, format: date-time }
 *                   isSent: { type: boolean }
 *                   isAcknowledged: { type: boolean }
 *                   groupId: { type: string }
 *                   doctorName: { type: string, description: Appointment rows only }
 *                   specialty: { type: string, description: Appointment rows only }
 *                   location: { type: string, description: Appointment rows only }
 *                   appointmentType: { type: string, description: Appointment rows only }
 *                   appointmentDate: { type: string, format: date-time, description: Appointment rows only }
 *                   notes: { type: string, description: Appointment rows only }
 *                   medicineName: { type: string, description: Medication rows only }
 *                   dosage: { type: string, description: Medication rows only }
 *                   form: { type: string, description: Medication rows only }
 *                   frequency: { type: string, description: Medication rows only }
 *                   timesPerDay: { type: number, description: Medication rows only }
 *                   startDate: { type: string, format: date-time, description: Medication rows only }
 *                   endDate: { type: string, format: date-time, description: Medication rows only }
 *             example:
 *               - _id: "6a40a7cb6b7c0dda2fcc1b2c"
 *                 type: "medication"
 *                 patient: "aaaaaaaaaaaaaaaaaaaaaaaa"
 *                 caregiver: { _id: "bbbbbbbbbbbbbbbbbbbbbbbb", name: "Caregiver Carol" }
 *                 scheduledTime: "2026-06-28T05:49:15.000Z"
 *                 isSent: false
 *                 isAcknowledged: false
 *                 groupId: "6a40a7cb6b7c0dda2fcc1b2b"
 *                 medicineName: "Donepezil"
 *                 dosage: "10mg"
 *                 form: "tablet"
 *                 frequency: "daily"
 *                 timesPerDay: 2
 *                 startDate: "2026-06-28T04:49:15.000Z"
 *                 endDate: "2026-06-30T04:49:15.000Z"
 *       403:
 *         description: Access denied
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
 *       400:
 *         description: Invalid reminder ID
 *       403:
 *         description: Access denied
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
 *       400:
 *         description: Invalid reminder ID
 *       403:
 *         description: Access denied
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
 *       400:
 *         description: Invalid reminder ID
 *       403:
 *         description: Access denied
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
 *       403:
 *         description: Access denied
 *       404:
 *         description: Reminder series not found
 */
router.delete(
  "/series",
  protect,
  authorize("caregiver", "admin"),
  deleteReminderSeries
);

/* ===============================
   ✅ Acknowledge Reminder
================================ */
/**
 * @swagger
 * /api/reminders/{id}/acknowledge:
 *   patch:
 *     summary: Patient acknowledges a sent reminder
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
 *         description: Reminder acknowledged successfully
 *       400:
 *         description: Invalid reminder ID
 *       403:
 *         description: Access denied
 *       404:
 *         description: Reminder not found
 */
router.patch(
  "/:id/acknowledge",
  protect,
  authorize("patient"),
  acknowledgeReminder
);

router
  .route("/:id")
  .get(protect, authorize("caregiver", "patient", "admin"), getReminderById)
  .put(protect, authorize("caregiver", "admin"), updateReminder)
  .delete(protect, authorize("caregiver", "admin"), deleteReminder);

export default router;