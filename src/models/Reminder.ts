import mongoose, { Schema, Document, Types } from "mongoose";
import { IMongooseBaseUser } from "./User";

/* ================================
   1️⃣ Base Reminder
================================ */

export interface IBaseReminder extends Document {
  type: "appointment" | "medication";
  patient: Types.ObjectId | IMongooseBaseUser; 
  caregiver: Types.ObjectId | IMongooseBaseUser;
  scheduledTime: Date;
  isSent: boolean;
  groupId?: string;
  location?: string;
  medicineName?: string;
  dosage?: string;
}

const baseOptions = {
  discriminatorKey: "type",
  timestamps: true,
};

const ReminderSchema = new Schema<IBaseReminder>(
  {
    type: {
      type: String,
      required: true,
      enum: ["appointment", "medication"],
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    caregiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scheduledTime: {
      type: Date,
      required: true,
    },
    isSent: {
      type: Boolean,
      default: false,
    },
    // Links all rows created from one request (a medication's many doses, or an
    // appointment plus its lead-time rows) so the schedule can be deleted as a
    // unit. Optional: legacy rows created before this field have none.
    groupId: {
      type: String,
      index: true,
    },
  },
  baseOptions
);
ReminderSchema.index({ isSent: 1, scheduledTime: 1 });

export const Reminder = mongoose.model<IBaseReminder>("Reminder", ReminderSchema);

/* ================================
   2️⃣ Appointment Reminder
================================ */

export interface IAppointmentReminder extends IBaseReminder {
  doctorName: string;
  specialty: string;
  location: string;
  appointmentType: "consultation" | "follow-up" | "scan" | "lab";
  appointmentDate: Date;
  notes?: string;
}

const AppointmentSchema = new Schema<IAppointmentReminder>({
  doctorName: { type: String, required: true },
  specialty: { type: String, required: true },
  location: { type: String, required: true },
  appointmentType: {
    type: String,
    enum: ["consultation", "follow-up", "scan", "lab"],
    required: true,
  },
  appointmentDate: { type: Date, required: true },
  notes: String,
});

export const AppointmentReminder = Reminder.discriminator<IAppointmentReminder>(
  "appointment",
  AppointmentSchema
);

/* ================================
   3️⃣ Medication Reminder
================================ */

export interface IMedicationReminder extends IBaseReminder {
  medicineName: string;
  dosage: string;
  form: "tablet" | "capsule" | "syrup" | "injection";
  frequency: "once" | "daily" | "weekly";
  timesPerDay: number;
  startDate: Date;
  endDate?: Date;
}

const MedicationSchema = new Schema<IMedicationReminder>({
  medicineName: { type: String, required: true },
  dosage: { type: String, required: true },
  form: {
    type: String,
    enum: ["tablet", "capsule", "syrup", "injection"],
    required: true,
  },
  frequency: {
    type: String,
    enum: ["once", "daily", "weekly"],
    required: true,
  },
  timesPerDay: {
    type: Number,
    default: 1,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: Date,
});

export const MedicationReminder = Reminder.discriminator<IMedicationReminder>(
  "medication",
  MedicationSchema
);