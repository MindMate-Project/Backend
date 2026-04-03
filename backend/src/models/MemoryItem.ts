import mongoose, { Schema, Document } from "mongoose";

export interface IMemoryItem extends Document {
  patient_id: string;
  type: "photo" | "video" | "text";
  title: string;
  caption: string;
  relation?: string;
  date?: Date;
  file_url?: string;
  cloudinary_public_id?: string;
  tags: string[];
}

const MemoryItemSchema = new Schema<IMemoryItem>(
  {
    patient_id: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["photo", "video", "text"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    caption: {
      type: String,
      required: true,
      trim: true,
    },
    relation: {
      type: String,
      trim: true,
      default: null,
    },
    date: {
      type: Date,
      default: null,
    },
    file_url: {
      type: String,
      default: null,
    },
    cloudinary_public_id: {
      type: String,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model<IMemoryItem>("MemoryItem", MemoryItemSchema);