import mongoose, { Document, Model, Schema, Types } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

// ---- INTERFACES ----

export interface IBaseUser {
    name: string;
    email: string;
    password?: string;
    role: "user" | "patient" | "caregiver" | "admin";
    verificationToken?: string;
    isVerified: boolean;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
}

export interface IUserMethods {
    matchPassword(enteredPassword: string): Promise<boolean>;
}

export interface IMongooseBaseUser extends IBaseUser, Document, IUserMethods {}

export interface IPatientProperties {
    dateOfBirth?: Date;
    medicalNotes?: string;
}

export interface ICaregiverProperties {
    relation: "son" | "daughter" | "sibling" | "medical_staff" | "other";
    phone: string;
    patients: Types.ObjectId[];
}

export interface IKnownPerson {
    name: string;
    relationship: string;
    average_embedding: number[];
    embeddings_count: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface IPatient extends IMongooseBaseUser, IPatientProperties {
    known_people: IKnownPerson[];
}

export interface IPatient extends IMongooseBaseUser, IPatientProperties {}
export interface ICaregiver extends IMongooseBaseUser, ICaregiverProperties {}

// ---- MODELS ----

export type UserModel = Model<IMongooseBaseUser>;
export type PatientModel = Model<IPatient>;
export type CaregiverModel = Model<ICaregiver>;

// ---- SCHEMAS ----

const baseOptions = {
    discriminatorKey: "role",
    collection: "users",
    timestamps: true
} as const;

// IMPORTANT: REMOVE ALL GENERICS HERE ❗
const userSchema = new Schema(
    {
        name: { type: String, required: true },
        email: {
            type: String,
            required: true,
            unique: true,
            validate: [validator.isEmail, "Enter a valid email"]
        },
        password: { type: String, required: true, select: false },
        role: { type: String, required: true, enum: ["user", "patient", "caregiver", "admin"], default: "user" },
        verificationToken: { type: String },
        isVerified: { type: Boolean, default: false },
        passwordResetToken: String,
        passwordResetExpires: Date
    },
    baseOptions
);

// ---- PASSWORD HOOK ----

userSchema.pre<IMongooseBaseUser>("save", async function (next) {

    if (!this.isModified("password")) return next();

    if (this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    next();
});

// ---- METHODS ----

userSchema.methods.matchPassword = async function (enteredPassword: string) {
    if (!this.password) throw new Error("Password is not set for this user");
    return await bcrypt.compare(enteredPassword, this.password);
};



// ---- BASE MODEL ----

export const User = mongoose.model<IMongooseBaseUser, UserModel>("User", userSchema);

// ---- DISCRIMINATORS (NO GENERICS IN SCHEMA!) ----

// Patient
const patientSchema = new Schema({
    dateOfBirth: Date,
    medicalNotes: String,

    known_people: [
        {
            name: {
                type: String,
                required: true,
                trim: true
            },
            relationship: {
                type: String,
                required: true,
                trim: true
            },

            average_embedding: {
                type: [Number], 
                required: true
            },

            embeddings_count: {
                type: Number,
                required: true,
                default: 1
            },

            created_at: {
                type: Date,
                default: Date.now
            },

            updated_at: {
                type: Date,
                default: Date.now
            }
        }
    ]
});

export const Patient = User.discriminator<IPatient, PatientModel>("patient", patientSchema);

// Caregiver
const caregiverSchema = new Schema({
    relation: {
        type: String,
        enum: ["son", "daughter", "sibling", "medical_staff", "other"],
        required: true
    },
    phone: {
        type: String,
        required: true,
        validate: {
            validator: (v: string) => /^\d{10,15}$/.test(v),
            message: (props: any) => `${props.value} is not a valid phone number!`
        }
    },
    patients: [{ type: Schema.Types.ObjectId, ref: "User" }]
});

export const Caregiver = User.discriminator<ICaregiver, CaregiverModel>("caregiver", caregiverSchema);
