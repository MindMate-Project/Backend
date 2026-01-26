import mongoose, { Schema, model, Document, Types } from "mongoose";

export interface IReminder extends Document {
  patient_id: Types.ObjectId;
  title?: string;
  time: Date;
  repeat_rule?: string; // daily, weekly, cron, etc
  status: "active" | "completed" | "cancelled";
  createdAt: Date;
}

const reminderSchema = new Schema<IReminder>(
  {
    patient_id: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    title: {
      type: String,
      trim: true,
    },
    time: {
      type: Date,
      required: true,
    },
    repeat_rule: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IReminder>("Reminder", reminderSchema);
