"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReminder = exports.updateReminder = exports.getReminderById = exports.getPatientReminders = exports.createReminder = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Reminder_1 = __importDefault(require("../models/Reminder"));
// ----------------------------------------------------------------------
/**
 * @desc Create new reminder
 * @route POST /api/reminders
 * @access Private (Patient / Caregiver)
 */
exports.createReminder = (0, express_async_handler_1.default)(async (req, res) => {
    const { patient_id, time, repeat_rule, status } = req.body;
    if (!patient_id || !time) {
        res.status(400);
        throw new Error("Missing required fields");
    }
    const reminder = await Reminder_1.default.create({
        patient_id,
        time,
        repeat_rule,
        status
    });
    res.status(201).json({
        message: "Reminder created successfully",
        data: reminder
    });
});
// ----------------------------------------------------------------------
/**
 * @desc Get all reminders for a patient
 * @route GET /api/reminders/:patientId
 * @access Private
 */
exports.getPatientReminders = (0, express_async_handler_1.default)(async (req, res) => {
    const { patientId } = req.params;
    const reminders = await Reminder_1.default.find({ patient_id: patientId });
    res.status(200).json({
        results: reminders.length,
        data: reminders
    });
});
// ----------------------------------------------------------------------
/**
 * @desc Get single reminder by ID
 * @route GET /api/reminder/:id
 * @access Private
 */
exports.getReminderById = (0, express_async_handler_1.default)(async (req, res) => {
    const reminder = await Reminder_1.default.findById(req.params.id);
    if (!reminder) {
        res.status(404);
        throw new Error("Reminder not found");
    }
    res.status(200).json({
        data: reminder
    });
});
// ----------------------------------------------------------------------
/**
 * @desc Update reminder
 * @route PUT /api/reminder/:id
 * @access Private
 */
exports.updateReminder = (0, express_async_handler_1.default)(async (req, res) => {
    const reminder = await Reminder_1.default.findById(req.params.id);
    if (!reminder) {
        res.status(404);
        throw new Error("Reminder not found");
    }
    reminder.time = req.body.time || reminder.time;
    reminder.repeat_rule = req.body.repeat_rule || reminder.repeat_rule;
    reminder.status = req.body.status || reminder.status;
    const updatedReminder = await reminder.save();
    res.status(200).json({
        message: "Reminder updated successfully",
        data: updatedReminder
    });
});
// ----------------------------------------------------------------------
/**
 * @desc Delete reminder
 * @route DELETE /api/reminder/:id
 * @access Private
 */
exports.deleteReminder = (0, express_async_handler_1.default)(async (req, res) => {
    const reminder = await Reminder_1.default.findById(req.params.id);
    if (!reminder) {
        res.status(404);
        throw new Error("Reminder not found");
    }
    await reminder.deleteOne();
    res.status(200).json({
        message: "Reminder deleted successfully"
    });
});
