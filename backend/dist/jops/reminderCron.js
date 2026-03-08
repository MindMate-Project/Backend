"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startReminderCron = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const Reminder_1 = require("../models/Reminder");
const firebase_service_1 = require("../services/firebase.service");
const startReminderCron = () => {
    node_cron_1.default.schedule("* * * * *", async () => {
        const now = new Date();
        try {
            // 1. Fetch pending reminders where scheduled time has passed or is now
            const reminders = await Reminder_1.Reminder.find({
                scheduledTime: { $lte: now },
                isSent: false,
            }).populate("patient caregiver");
            if (reminders.length === 0)
                return;
            // 2. Map through reminders to create an array of execution promises
            const reminderPromises = reminders.map(async (reminder) => {
                try {
                    const patient = reminder.patient;
                    const caregiver = reminder.caregiver;
                    let title = "Reminder 🔔";
                    let body = "";
                    // Determine message content based on reminder type
                    switch (reminder.type) {
                        case "appointment":
                            title = "Appointment Time!";
                            const loc = reminder.location || "your scheduled location";
                            body = `You have an appointment at ${loc}`;
                            break;
                        case "medication":
                            title = "Medicine Time!";
                            const med = reminder.medicineName || "your medicine";
                            const dose = reminder.dosage || "the prescribed dose";
                            body = `Take ${med} - ${dose}`;
                            break;
                        default:
                            body = "You have a reminder.";
                    }
                    // 3. Collect unique FCM tokens from both patient and caregiver
                    const tokens = [
                        ...(patient?.fcmTokens || []),
                        ...(caregiver?.fcmTokens || []),
                    ];
                    // 4. Send push notification if tokens exist
                    if (tokens.length > 0) {
                        await (0, firebase_service_1.sendPush)(tokens, title, body);
                    }
                    // 5. Mark as sent and persist to database
                    reminder.isSent = true;
                    await reminder.save();
                }
                catch (individualError) {
                    // Log error for a specific reminder without stopping the entire cron job
                    console.error(`Error processing reminder ID: ${reminder._id}`, individualError);
                }
            });
            // 6. Execute all reminder processes concurrently for better performance
            await Promise.allSettled(reminderPromises);
        }
        catch (error) {
            // Log critical errors (e.g., Database connection issues)
            console.error("Critical Reminder Cron Error:", error);
        }
        console.log("Cron Job Running every minute...");
    });
};
exports.startReminderCron = startReminderCron;
