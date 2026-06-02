import cron from "node-cron";
import { Reminder } from "../models/Reminder";
import { sendPush } from "../services/firebase.service";
import { IMongooseBaseUser } from "../models/User";
export const startReminderCron = () => {
cron.schedule("* * * * *", async () => {
  const now = new Date();

  try {
    // 1. Fetch pending reminders where scheduled time has passed or is now
    const reminders = await Reminder.find({
      scheduledTime: { $lte: now },
      isSent: false,
    }).populate("patient caregiver");

    if (reminders.length === 0) return;

    // 2. Map through reminders to create an array of execution promises
    const reminderPromises = reminders.map(async (reminder) => {
      try {
        const patient = reminder.patient as unknown as IMongooseBaseUser;
        const caregiver = reminder.caregiver as unknown as IMongooseBaseUser;
        
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
        const tokens: string[] = [
          ...(patient?.fcmTokens || []),
          ...(caregiver?.fcmTokens || []),
        ];

        // 4. Send push notification if tokens exist
        if (tokens.length > 0) {
          await sendPush(tokens, title, body);
        }

        // 5. Mark as sent and persist to database
        reminder.isSent = true;
        await reminder.save();

      } catch (individualError) {
        // Log error for a specific reminder without stopping the entire cron job
        console.error(`Error processing reminder ID: ${reminder._id}`, individualError);
      }
    });

    // 6. Execute all reminder processes concurrently for better performance
    await Promise.allSettled(reminderPromises);
    console.log(`Reminder cron: processed ${reminders.length} due reminder(s)`);

  } catch (error) {
    // Log critical errors (e.g., Database connection issues)
    console.error("Critical Reminder Cron Error:", error);
  }
  });
};