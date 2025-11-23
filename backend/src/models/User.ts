import mongoose, { Document, Model, Schema, SchemaDefinition, SchemaOptions } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

// --- 1. DEFINE INTERFACES FOR TYPE CHECKING ---

// 1.1 Base User Properties (The actual data fields in the Schema)
export interface IBaseUser {
    name: string;
    email: string;
    password?: string;
    role: "user" | "patient" | "caregiver"; // Explicit role property for the discriminator
    verificationToken?: string;
    isVerified: boolean;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
}

// 1.2 User Methods (Functions added to userSchema.methods)
export interface IUserMethods {
    matchPassword(enteredPassword: string): Promise<boolean>;
}

// 1.3 Patient Properties (Discriminator fields)
export interface IPatientProperties {
    dateOfBirth?: Date;
    medicalNotes?: string;
}

// 1.4 Caregiver Properties (Discriminator fields)
export interface ICaregiverProperties {
    relation: "son" | "daughter" | "sibling" | "medical_staff" | "other";
    phone: string;
    rule: "admin" | "user";
    patients: ObjectId[]; // Array of ObjectIds
}

// 1.5 The Final User Document Interface (Used for instances like user.save())
// Combines base properties, Mongoose Document methods, and custom methods
export interface IUser extends IBaseUser, Document, IUserMethods { role:"user"}

// 1.6 Discriminator Document Interfaces
export interface IPatient extends IBaseUser, IPatientProperties, Document, IUserMethods {
    role: "patient";
}

export interface ICaregiver extends IBaseUser, ICaregiverProperties, Document, IUserMethods {
    role: "caregiver";
}

// 1.7 Model Type Definitions (Used when calling User.findOne() or User.create())
// This allows Mongoose methods to be typed correctly on the Model itself
export interface UserModel extends Model<IUser> {}
export interface PatientModel extends Model<IPatient> {}
export interface CaregiverModel extends Model<ICaregiver> {}

// --- 2. DEFINE SCHEMAS AND MODELS ---

const baseOptions: SchemaOptions = { discriminatorKey: "role", collection: "users" };
// Base User Schema
const userSchema = new mongoose.Schema<IUser, UserModel>(
    {
        name: { type: String, required: true },
        email: {
            type: String,
            required: true,
            unique: true,
            validate: [validator.isEmail, "Enter a valid email"]
        },
        password: { type: String, required: true, select: false }, // Added select: false for security
        verificationToken: { type: String },
        isVerified: { type: Boolean, default: false },
        passwordResetToken: String,
        passwordResetExpires: Date,
    },
    { ...baseOptions, timestamps: true }
);

// Pre-Save Hook for Password Hashing
userSchema.pre("save", async function (next) {
    const user = this as IUser; // Cast 'this' to IUser to access custom methods/fields
    if (!user.isModified("password")) return next();
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password!, salt); // Use non-null assertion or conditional check
    next();
});

// Methods (Match Password)
userSchema.methods.matchPassword = async function (this: IUser, enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password!);
};

// Export Base Model
export const User = mongoose.model<IUser, UserModel>("User", userSchema);

// --- DISCRIMINATORS ---

// Patient Schema
const patientSchema = new mongoose.Schema<IPatientProperties>({
    dateOfBirth: { type: Date },
    medicalNotes: { type: String }
}, { timestamps: true });

export const Patient = User.discriminator<IPatient, PatientModel>("patient", patientSchema);

// Caregiver Schema
const caregiverSchema = new mongoose.Schema<ICaregiverProperties>({
    relation: {
        type: String,
        enum: ["son", "daughter", "sibling", "medical_staff", "other"],
        required: true
    },
    phone: {
        type: String,
        required: true,
        validate: {
            validator: function (v: string) {
                return /^\d{10,15}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    rule: { type: String, enum: ["admin", "user"], default: "user" },
    patients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

export const Caregiver = User.discriminator<ICaregiver, CaregiverModel>("caregiver", caregiverSchema);