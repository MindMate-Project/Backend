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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicationReminder = exports.AppointmentReminder = exports.Reminder = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const baseOptions = {
    discriminatorKey: "type",
    timestamps: true,
};
const ReminderSchema = new mongoose_1.Schema({
    type: {
        type: String,
        required: true,
        enum: ["appointment", "medication"],
    },
    patient: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    caregiver: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    scheduledTime: {
        type: Date,
        required: true,
    },
    isSent: {
        type: Boolean,
        default: false,
    },
}, baseOptions);
exports.Reminder = mongoose_1.default.model("Reminder", ReminderSchema);
const AppointmentSchema = new mongoose_1.Schema({
    doctorName: { type: String, required: true },
    specialty: { type: String, required: true },
    location: { type: String, required: true },
    appointmentType: {
        type: String,
        enum: ["consultation", "follow-up", "scan", "lab"],
        required: true,
    },
    appointmentDate: { type: Date, required: true },
    notes: String,
});
exports.AppointmentReminder = exports.Reminder.discriminator("appointment", AppointmentSchema);
const MedicationSchema = new mongoose_1.Schema({
    medicineName: { type: String, required: true },
    dosage: { type: String, required: true },
    form: {
        type: String,
        enum: ["tablet", "capsule", "syrup", "injection"],
        required: true,
    },
    frequency: {
        type: String,
        enum: ["once", "daily", "weekly"],
        required: true,
    },
    timesPerDay: {
        type: Number,
        default: 1,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: Date,
});
exports.MedicationReminder = exports.Reminder.discriminator("medication", MedicationSchema);
