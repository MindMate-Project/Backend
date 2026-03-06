"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reminder_controller_1 = require("../controllers/reminder.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const authorize_middleware_1 = require("../middlewares/authorize.middleware");
const router = express_1.default.Router();
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
router.post("/", auth_middleware_1.protect, (0, authorize_middleware_1.authorize)("caregiver", "admin"), reminder_controller_1.createReminder);
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
router.get("/patient/:patientId", auth_middleware_1.protect, (0, authorize_middleware_1.authorize)("caregiver", "patient", "admin"), reminder_controller_1.getPatientReminders);
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
router
    .route("/:id")
    .get(auth_middleware_1.protect, (0, authorize_middleware_1.authorize)("caregiver", "patient", "admin"), reminder_controller_1.getReminderById)
    .put(auth_middleware_1.protect, (0, authorize_middleware_1.authorize)("caregiver", "admin"), reminder_controller_1.updateReminder)
    .delete(auth_middleware_1.protect, (0, authorize_middleware_1.authorize)("caregiver", "admin"), reminder_controller_1.deleteReminder);
exports.default = router;
