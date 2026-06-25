import mongoose,{ Schema, model, Document, Types } from "mongoose";

export interface IAlert extends Document {
  patient_id: Types.ObjectId;
  alert_type: string;
  timestamp: Date;
  acknowledged_by?: Types.ObjectId;
}

const alertSchema = new Schema<IAlert>(
  {
    patient_id: {
      type: Schema.Types.ObjectId,
      ref: "patient",
      required: true,
    },
    alert_type: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    acknowledged_by: {
      type: Schema.Types.ObjectId,
      ref: "caregiver",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IAlert>("Alert", alertSchema);
