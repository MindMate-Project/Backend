import mongoose, { Document, Model, Schema, SchemaOptions, Types } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb"; // Note: Prefer Types.ObjectId from mongoose

// --- 1. DEFINE INTERFACES FOR TYPE CHECKING (Refactored) ---

// 1.1 Base User Properties (Data fields)
export interface IBaseUser {
    name: string;
    email: string;
    password?: string;
    role: "user" | "patient" | "caregiver" | "admin";    verificationToken?: string;
    isVerified: boolean;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
}

// 1.2 User Methods (Functions added to userSchema.methods)
export interface IUserMethods {
    matchPassword(enteredPassword: string): Promise<boolean>;
}

// 1.3 Core Mongoose Document Interface (THE KEY FIX)
// This combines base data, Mongoose Document methods, and custom methods.
export interface IMongooseBaseUser extends IBaseUser, Document<Types.ObjectId>, IUserMethods {}


// 1.4 Discriminator Properties (Fields added by discriminator schemas)
export interface IPatientProperties {
    dateOfBirth?: Date;
    medicalNotes?: string;
}

export interface ICaregiverProperties {
    relation: "son" | "daughter" | "sibling" | "medical_staff" | "other";
    phone: string;
    //rule: "admin" | "user";
    patients: Types.ObjectId[];
}

// 1.5 Specific Document Interfaces (Narrowed role for internal use)
// This is the type that will be attached to req.user
export interface IUser extends IMongooseBaseUser { role: "user" }
export interface IPatient extends IMongooseBaseUser, IPatientProperties { role: "patient" }
export interface ICaregiver extends IMongooseBaseUser, ICaregiverProperties { role: "caregiver" }


// 1.6 Model Type Definitions (Used when calling User.findOne() or User.create())
export type UserModel = Model<IUser> & Model<IPatient> & Model<ICaregiver>; 
export type PatientModel = Model<IPatient>;
export type CaregiverModel = Model<ICaregiver>;

// --- 2. DEFINE SCHEMAS AND MODELS ---

const baseOptions: SchemaOptions = { discriminatorKey: "role", collection: "users", timestamps: true };

// Base User Schema uses IMongooseBaseUser
const userSchema = new mongoose.Schema<IMongooseBaseUser, UserModel>(
    {
        name: { type: String, required: true },
        email: {
            type: String,
            required: true,
            unique: true,
            validate: [validator.isEmail, "Enter a valid email"]
        },
        password: { type: String, required: true, select: false },
        role: { type: String, required: true, enum: ["user", "patient", "caregiver","admin"], default: "user" },
        verificationToken: { type: String },
        isVerified: { type: Boolean, default: false },
        passwordResetToken: String,
        passwordResetExpires: Date,
    },
    baseOptions
);

// Pre-Save Hook for Password Hashing
userSchema.pre("save", async function (next) {
    const user = this as IMongooseBaseUser; 
    if (!user.isModified("password")) return next();
    
    if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
    }
    next();
});

// Methods (Match Password)
userSchema.methods.matchPassword = async function (this: IMongooseBaseUser, enteredPassword: string): Promise<boolean> {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

// Export Base Model
export const User = mongoose.model<IMongooseBaseUser, UserModel>("User", userSchema);

// --- DISCRIMINATORS ---

// Patient Schema
const patientSchema = new mongoose.Schema<IPatientProperties>({
    dateOfBirth: { type: Date },
    medicalNotes: { type: String }
}); 

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
   // rule: { type: String, enum: ["admin", "user"], default: "user" },
    patients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

export const Caregiver = User.discriminator<ICaregiver, CaregiverModel>("caregiver", caregiverSchema);