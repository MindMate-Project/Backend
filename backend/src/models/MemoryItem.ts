import mongoose, { Schema, Document } from "mongoose";

export interface IMemoryItem extends Document {
  patient_id: string;
  type: "photo" | "video" | "text";
  content_ref: string;
  tags: string[];
}

const MemoryItemSchema = new Schema<IMemoryItem>(
  {
    patient_id: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["photo", "video", "text"],
      required: true
    },
    content_ref: {
      type: String,
      required: true
    },
    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IMemoryItem>(
  "MemoryItem",
  MemoryItemSchema
);
