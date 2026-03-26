import mongoose, { Document, Model, Schema, Types } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

// ---- INTERFACES ----

export interface IBaseUser {
    name: string;
    email: string;
    password?: string;
    gender: "male" | "female";
    address: string;
    dateOfBirth?: Date;
    phoneNumber: string;
    fcmTokens: string[];
    role: "user" | "patient" | "caregiver" | "admin";
    verificationToken?: string;
    isVerified: boolean;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    resetSessionToken?: string;
    profilePicture?: string;
    profilePicture_public_id?: string;
}

export interface IUserMethods {
    matchPassword(enteredPassword: string): Promise<boolean>;
}

export interface IMongooseBaseUser extends IBaseUser, Document, IUserMethods { }

export interface IMedicalNotes {
    diagnosis?: string;
    stage?: string;
    chronicDiseases?: string[];
    allergies?: string[];
    currentMedication?: string[];
}

export interface IPatientProperties {
    medicalNotes?: IMedicalNotes;
    caregivers: Types.ObjectId[];
    pendingCaregiverRequests: IPendingCaregiverRequest[];
}

export interface IPatientRef {
    patient: Types.ObjectId;
    relationship: "son" | "daughter" | "sibling" | "medical_staff" | "other";
    connectedAt?: Date;
}

export interface ICaregiverProperties {
    patients: IPatientRef[];
}

export interface IKnownPerson {
    firstName: string;
    lastName: string;
    relationship: string;
    average_embedding: number[];
    embeddings_count: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface IPatientDevice {
    deviceId: string;
    latitude: number;
    longitude: number;
    timestamp: Date;
    battery?: number;
}

export interface IPendingCaregiverRequest {
    caregiver: Types.ObjectId;
    relationship: "son" | "daughter" | "sibling" | "medical_staff" | "other";
    status: "pending" | "accepted" | "rejected";
    requestedAt: Date;
    respondedAt?: Date;
}

export interface IPatient extends IMongooseBaseUser, IPatientProperties {
    known_people: IKnownPerson[];
    device: IPatientDevice;
}

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
        fcmTokens: { type: [String], default: [] },
        dateOfBirth: { type: Date },
        role: {
            type: String,
            required: true,
            enum: ["user", "patient", "caregiver", "admin"],
            default: "user"
        },
        phoneNumber: {
            type: String,
            required: true,
            validate: {
                validator: (v: string) => /^\d{10,15}$/.test(v),
                message: (props: any) => `${props.value} is not a valid phone number!`
            }
        },
        address: { type: String, required: true },
        gender: { type: String, required: true, enum: ["male", "female"] },
        verificationToken: { type: String },
        isVerified: { type: Boolean, default: false },
        passwordResetToken: String,
        passwordResetExpires: Date,
        resetSessionToken: String,
        profilePicture: {
            type: String,
            default: null,
        },
        profilePicture_public_id: {
            type: String,
            default: null,
        },
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

// ---- DISCRIMINATORS ----

// Patient
const patientSchema = new Schema({
    medicalNotes: {
        diagnosis: { type: String },
        stage: { type: String },
        chronicDiseases: { type: [String], default: [] },
        allergies: { type: [String], default: [] },
        currentMedication: { type: [String], default: [] }
    },
    caregivers: [{ type: Types.ObjectId, ref: "caregiver" }],
    pendingCaregiverRequests: [
        {
            caregiver: {
                type: Types.ObjectId,
                ref: "caregiver",
                required: true
            },
            relationship: {
                type: String,
                enum: ["son", "daughter", "sibling", "medical_staff", "other"],
                required: true
            },
            status: {
                type: String,
                enum: ["pending", "accepted", "rejected"],
                default: "pending"
            },
            requestedAt: {
                type: Date,
                default: Date.now
            },
            respondedAt: {
                type: Date
            }
        }
    ],
    known_people: [
        {
            firstName: { type: String, required: true, trim: true },
            lastName: { type: String, required: true, trim: true },
            relationship: { type: String, required: true, trim: true },
            average_embedding: { type: [Number], required: true },
            embeddings_count: { type: Number, required: true, default: 1 },
            created_at: { type: Date, default: Date.now },
            updated_at: { type: Date, default: Date.now }
        }
    ],
    device: {
        deviceId: { type: String },
        latitude: { type: Number },
        longitude: { type: Number },
        timestamp: { type: Date, default: Date.now },
        battery: { type: Number }
    }
});

export const Patient = User.discriminator<IPatient, PatientModel>("patient", patientSchema);

// Caregiver
const caregiverSchema = new Schema({
    patients: [
        {
            patient: {
                type: Types.ObjectId,
                ref: "patient",
                required: true
            },
            relationship: {
                type: String,
                enum: ["son", "daughter", "sibling", "medical_staff", "other"],
                required: true
            },
            connectedAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
});

export const Caregiver = User.discriminator<ICaregiver, CaregiverModel>("caregiver", caregiverSchema);