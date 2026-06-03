import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import {
  Reminder,
  AppointmentReminder,
  MedicationReminder,
} from "../models/Reminder";
import { canAccessPatient } from "../utils/ownership";

/* =============================================================
    ✅ Create Reminder
    Handles single and recurring (daily/weekly) reminders.
    Generates multiple database entries based on frequency.
============================================================= */
export const createReminder = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { type, scheduledTime, frequency, timesPerDay, endDate, appointmentDate,...rest } = req.body;

    // Basic validation: ensure type and initial time are provided
    if (!type || !scheduledTime) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const start = new Date(scheduledTime);
    // Prevent creating reminders for dates that have already passed
    if (start < new Date()) {
      res.status(400).json({ message: "Scheduled time cannot be in the past" });
      return;
    }

    if (!(await canAccessPatient(req.user, req.body.patient))) {
      return res.status(403).json({
        message: "You are not allowed to create reminders for this patient",
      });
    }

    const remindersToCreate = [];
  if (type === "appointment") {
      // 1-reminder before actual date
      const actualAppointmentTime = start;
      remindersToCreate.push({

        ...rest,

        type,

        scheduledTime: actualAppointmentTime,

        appointmentDate: appointmentDate ? new Date(appointmentDate) : actualAppointmentTime,

        isSent: false,

      });
    // 2-reminder before one day
      const dayBefore = new Date(actualAppointmentTime);

      dayBefore.setHours(dayBefore.getHours() - 24);

      if (dayBefore > new Date()) {

        remindersToCreate.push({

          ...rest,

          type,

          scheduledTime: dayBefore,

          appointmentDate: appointmentDate ? new Date(appointmentDate) : actualAppointmentTime,

          notes: `(Reminder: 24h before) ${rest.notes || ""}`,

          isSent: false,

        });

      }
      // 3-before one hour
      const hourBefore = new Date(actualAppointmentTime);

      hourBefore.setHours(hourBefore.getHours() - 1);

      if (hourBefore > new Date()) {

        remindersToCreate.push({

          ...rest,

          type,

          scheduledTime: hourBefore,

          appointmentDate: appointmentDate ? new Date(appointmentDate) : actualAppointmentTime,

          notes: `(Reminder: 1h before) ${rest.notes || ""}`,

          isSent: false,

        });

      }
    } else{
    const iterations = timesPerDay || 1; // Default to 1 dose/event per day
    const intervalHours = 24 / iterations; // Calculate spacing (e.g., 3 times = every 8 hours)
    
    // Determine the boundary date for the recurrence loop
    const lastDate = frequency === "daily" && endDate ? new Date(endDate) : new Date(start);

    let currentDay = new Date(start);

    // Loop through each day from start date until the end date
    while (currentDay <= lastDate) {
      // For each day, create the specified number of doses/instances
      for (let i = 0; i < iterations; i++) {
        const instanceTime = new Date(currentDay);
        
        // Offset the hour based on the iteration (e.g., 08:00, 16:00, 00:00)
        instanceTime.setHours(instanceTime.getHours() + (i * intervalHours));

        // Only add to array if the specific instance time hasn't exceeded the endDate
        if (instanceTime <= lastDate || frequency === "once") {
          remindersToCreate.push({
            ...rest,
            type,
            scheduledTime: instanceTime,
            frequency,
            timesPerDay,
            endDate,
            status: "pending",
            isSent: false,
          });
        }
      }
      
      // Move the cursor to the next calendar day
      currentDay.setDate(currentDay.getDate() + 1);
      
      // Safety break to prevent infinite loops or database flooding
      if (remindersToCreate.length > 500) break;
    }}

    let result;
    // Use insertMany for high performance when saving multiple documents at once
    if (type === "appointment") {
      result = await AppointmentReminder.insertMany(remindersToCreate);
    } else if (type === "medication") {
      result = await MedicationReminder.insertMany(remindersToCreate);
    } else {
      res.status(400).json({ message: "Invalid reminder type" });
      return;
    }

    res.status(201).json({
      message: `${remindersToCreate.length} reminders created successfully`,
      data: result,
    });
  } catch (error) {
    console.error("Error creating reminder:", error);
    res.status(500).json({ message: "Error creating reminder" });
  }
});

/* =============================================================
    ✅ Get All Reminders For Patient
    Retrieves all instances and populates related user data.
============================================================= */
export const getPatientReminders = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!(await canAccessPatient(req.user, req.params.patientId))) {
      return res.status(403).json({ message: "Access denied" });
    }

    const reminders = await Reminder.find({
      patient: req.params.patientId,
    })
      .sort({ scheduledTime: 1 }) // Order by time (Ascending)
      .populate("patient caregiver");

    res.json(reminders);
  } catch (error) {
    console.error("Error fetching reminders:", error);
    res.status(500).json({ message: "Error fetching reminders" });
  }
});

/* =============================================================
    ✅ Get Single Reminder
============================================================= */
export const getReminderById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const reminder = await Reminder.findById(req.params.id).populate(
      "patient caregiver"
    );

    if (!reminder) {
      res.status(404).json({ message: "Reminder not found" });
      return;
    }

    const ownerId = (reminder.patient as any)?._id ?? reminder.patient;
    if (!(await canAccessPatient(req.user, ownerId))) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(reminder);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reminder" });
  }
});

/* =============================================================
    ✅ Update Reminder
    Updates specific fields. Protects status/type from manual edit.
============================================================= */
export const updateReminder = asyncHandler(async (req: Request, res: Response) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      res.status(404).json({ message: "Reminder not found" });
      return;
    }

    if (!(await canAccessPatient(req.user, reminder.patient as any))) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Protect system-controlled fields from being overwritten via body
    delete req.body.isSent;
    delete req.body.type;
    delete req.body.patient;

    Object.assign(reminder, req.body);
    await reminder.save();

    res.json(reminder);
  } catch (error) {
    res.status(500).json({ message: "Error updating reminder" });
  }
});


/* =============================================================
    ✅ Delete Reminder
============================================================= */
export const deleteReminder = asyncHandler(async (req: Request, res: Response) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      res.status(404).json({ message: "Reminder not found" });
      return;
    }

    if (!(await canAccessPatient(req.user, reminder.patient as any))) {
      return res.status(403).json({ message: "Access denied" });
    }

    await reminder.deleteOne();

    res.json({ message: "Reminder deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting reminder" });
  }
});