import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Types } from "mongoose";
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
    // Whitelist the fields we persist instead of spreading req.body, so clients
    // cannot inject schema fields like _id, isSent, createdAt or groupId.
    const {
      type,
      scheduledTime,
      frequency,
      timesPerDay,
      endDate,
      appointmentDate,
      patient,
      caregiver,
      // appointment fields
      doctorName,
      specialty,
      location,
      appointmentType,
      notes,
      // medication fields
      medicineName,
      dosage,
      form,
      startDate,
    } = req.body;

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
      res.status(403).json({
        message: "You are not allowed to create reminders for this patient",
      });
      return;
    }

    // One id shared by every row of this create, so the whole schedule (all
    // medication doses, or an appointment plus its lead-time rows) can be
    // deleted as a unit later.
    const groupId = new Types.ObjectId().toString();

    const apptBase = {
      patient,
      caregiver,
      doctorName,
      specialty,
      location,
      appointmentType,
      notes,
      groupId,
    };
    const medBase = {
      patient,
      caregiver,
      medicineName,
      dosage,
      form,
      startDate,
      groupId,
    };

    const remindersToCreate = [];
  if (type === "appointment") {
      // 1-reminder before actual date
      const actualAppointmentTime = start;
      remindersToCreate.push({
        ...apptBase,
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
          ...apptBase,
          type,
          scheduledTime: dayBefore,
          appointmentDate: appointmentDate ? new Date(appointmentDate) : actualAppointmentTime,
          notes: `(Reminder: 24h before) ${notes || ""}`,
          isSent: false,
        });

      }
      // 3-before one hour
      const hourBefore = new Date(actualAppointmentTime);

      hourBefore.setHours(hourBefore.getHours() - 1);

      if (hourBefore > new Date()) {

        remindersToCreate.push({
          ...apptBase,
          type,
          scheduledTime: hourBefore,
          appointmentDate: appointmentDate ? new Date(appointmentDate) : actualAppointmentTime,
          notes: `(Reminder: 1h before) ${notes || ""}`,
          isSent: false,
        });

      }
    } else {
    const iterations = timesPerDay && timesPerDay > 0 ? timesPerDay : 1;
    const intervalHours = 24 / iterations;
    const stepDays = frequency === "weekly" ? 7 : 1;

    const lastDate =
      frequency === "once" || !endDate ? new Date(start) : new Date(endDate);

    let currentDay = new Date(start);

    while (currentDay <= lastDate) {
      for (let i = 0; i < iterations; i++) {
        const instanceTime = new Date(currentDay);

        instanceTime.setHours(
          instanceTime.getHours() + Math.round(i * intervalHours)
        );

        if (instanceTime <= lastDate || frequency === "once") {
          remindersToCreate.push({
            ...medBase,
            type,
            scheduledTime: instanceTime,
            frequency,
            timesPerDay,
            endDate,
            isSent: false,
          });
        }
      }

      // Move the cursor to the next calendar day
      currentDay.setDate(currentDay.getDate() + stepDays);

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
      res.status(403).json({ message: "Access denied" });
      return;
    }

    // Optional filtering/paging. When no query params are sent the response is
    // unchanged (a plain array of every reminder), so existing clients keep
    // working; web/future clients can scope by date window or page.
    const { from, to, limit, skip } = req.query;
    const filter: Record<string, any> = { patient: req.params.patientId };
    if (from || to) {
      filter.scheduledTime = {
        ...(from ? { $gte: new Date(String(from)) } : {}),
        ...(to ? { $lte: new Date(String(to)) } : {}),
      };
    }

    let query = Reminder.find(filter)
      .sort({ scheduledTime: 1 }) // Order by time (Ascending)
      .populate("patient caregiver");

    const skipN = Number(skip);
    const limitN = Number(limit);
    if (Number.isFinite(skipN) && skipN > 0) query = query.skip(skipN);
    if (Number.isFinite(limitN) && limitN > 0) query = query.limit(limitN);

    const reminders = await query;
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
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: "Invalid reminder ID" });
      return;
    }

    const reminder = await Reminder.findById(req.params.id).populate(
      "patient caregiver"
    );

    if (!reminder) {
      res.status(404).json({ message: "Reminder not found" });
      return;
    }

    const ownerId = (reminder.patient as any)?._id ?? reminder.patient;
    if (!(await canAccessPatient(req.user, ownerId))) {
      res.status(403).json({ message: "Access denied" });
      return;
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
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: "Invalid reminder ID" });
      return;
    }

    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      res.status(404).json({ message: "Reminder not found" });
      return;
    }

    if (!(await canAccessPatient(req.user, reminder.patient as any))) {
      res.status(403).json({ message: "Access denied" });
      return;
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
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: "Invalid reminder ID" });
      return;
    }

    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      res.status(404).json({ message: "Reminder not found" });
      return;
    }

    if (!(await canAccessPatient(req.user, reminder.patient as any))) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    await reminder.deleteOne();

    res.json({ message: "Reminder deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting reminder" });
  }
});

/* =============================================================
    ✅ Acknowledge Reminder
    Patient confirms they saw/responded to a sent reminder.
============================================================= */
export const acknowledgeReminder = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: "Invalid reminder ID" });
      return;
    }

    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      res.status(404).json({ message: "Reminder not found" });
      return;
    }

    if (!(await canAccessPatient(req.user, reminder.patient as any))) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    reminder.isAcknowledged = true;
    await reminder.save();

    res.json(reminder);
  } catch (error) {
    res.status(500).json({ message: "Error acknowledging reminder" });
  }
});

/* =============================================================
    ✅ Delete Reminder Series
    Removes every reminder sharing a groupId (a whole medication
    schedule, or an appointment plus its lead-time rows).
============================================================= */
export const deleteReminderSeries = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { groupId } = req.query;
    if (!groupId) {
      res.status(400).json({ message: "groupId is required" });
      return;
    }

    // Authorize against any one row of the series.
    const sample = await Reminder.findOne({ groupId: String(groupId) });
    if (!sample) {
      res.status(404).json({ message: "Reminder series not found" });
      return;
    }

    if (!(await canAccessPatient(req.user, sample.patient as any))) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const result = await Reminder.deleteMany({ groupId: String(groupId) });

    res.json({
      message: "Reminder series deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting reminder series" });
  }
});