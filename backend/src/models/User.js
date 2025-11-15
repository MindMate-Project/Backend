import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

const options = { discriminatorKey: "role", collection: "users" };

// Base User Schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: [validator.isEmail, "Enter a valid email"]
    },
    password: { type: String, required: true },
    verificationToken: { type: String },
    isVerified: { type: Boolean, default: false },//new
      passwordResetToken: String,
      passwordResetExpires: Date,

  },
  { ...options, timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model("User", userSchema);

// Patient
const patientSchema = new mongoose.Schema({
  dateOfBirth: { type: Date },
  medicalNotes: { type: String }
}, { timestamps: true });

export const Patient = User.discriminator("patient", patientSchema);

// Caregiver
const caregiverSchema = new mongoose.Schema({
  relation: {
    type: String,
    enum: ["son", "daughter", "sibling", "medical_staff", "other"],
    required: true
  },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{10,15}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  rule: { type: String, enum: ["admin", "user"], default: "user" },
  patients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

export const Caregiver = User.discriminator("caregiver", caregiverSchema);
