"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Caregiver = exports.Patient = exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const validator_1 = __importDefault(require("validator"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// ---- SCHEMAS ----
const baseOptions = {
    discriminatorKey: "role",
    collection: "users",
    timestamps: true
};
// IMPORTANT: REMOVE ALL GENERICS HERE ❗
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: [validator_1.default.isEmail, "Enter a valid email"]
    },
    password: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ["user", "patient", "caregiver", "admin"], default: "user" },
    verificationToken: { type: String },
    isVerified: { type: Boolean, default: false },
    passwordResetToken: String,
    passwordResetExpires: Date,
    resetSessionToken: String
}, baseOptions);
// ---- PASSWORD HOOK ----
userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    if (this.password) {
        const salt = await bcryptjs_1.default.genSalt(10);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
    }
    next();
});
// ---- METHODS ----
userSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password)
        throw new Error("Password is not set for this user");
    return await bcryptjs_1.default.compare(enteredPassword, this.password);
};
// ---- BASE MODEL ----
exports.User = mongoose_1.default.model("User", userSchema);
// ---- DISCRIMINATORS (NO GENERICS IN SCHEMA!) ----
// Patient
const patientSchema = new mongoose_1.Schema({
    dateOfBirth: Date,
    medicalNotes: String,
    caregivers: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "caregiver" }],
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
    ],
    device: {
        deviceId: {
            type: String,
        },
        latitude: {
            type: Number,
        },
        longitude: {
            type: Number,
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        battery: {
            type: Number
        }
    }
});
exports.Patient = exports.User.discriminator("patient", patientSchema);
// Caregiver
const caregiverSchema = new mongoose_1.Schema({
    relation: {
        type: String,
        enum: ["son", "daughter", "sibling", "medical_staff", "other"],
        required: true
    },
    phone: {
        type: String,
        required: true,
        validate: {
            validator: (v) => /^\d{10,15}$/.test(v),
            message: (props) => `${props.value} is not a valid phone number!`
        }
    },
    patients: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "patient" }]
});
exports.Caregiver = exports.User.discriminator("caregiver", caregiverSchema);
