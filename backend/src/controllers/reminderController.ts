import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Reminder from "../models/Reminder";

// ----------------------------------------------------------------------

/**
 * @desc Create new reminder
 * @route POST /api/reminders
 * @access Private (Patient / Caregiver)
 */
export const createReminder = asyncHandler(async (req: Request, res: Response) => {
  const { patient_id, time, repeat_rule, status } = req.body;

  if (!patient_id || !time) {
    res.status(400);
    throw new Error("Missing required fields");
  }

  const reminder = await Reminder.create({
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
export const getPatientReminders = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;

  const reminders = await Reminder.find({ patient_id: patientId });

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
export const getReminderById = asyncHandler(async (req: Request, res: Response) => {
  const reminder = await Reminder.findById(req.params.id);

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
export const updateReminder = asyncHandler(async (req: Request, res: Response) => {
  const reminder = await Reminder.findById(req.params.id);

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
export const deleteReminder = asyncHandler(async (req: Request, res: Response) => {
  const reminder = await Reminder.findById(req.params.id);

  if (!reminder) {
    res.status(404);
    throw new Error("Reminder not found");
  }

  await reminder.deleteOne();

  res.status(200).json({
    message: "Reminder deleted successfully"
  });
});
