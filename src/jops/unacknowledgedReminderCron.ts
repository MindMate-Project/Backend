import cron from "node-cron";
import { Reminder } from "../models/Reminder";
import { sendPush } from "../services/firebase.service";
import { IMongooseBaseUser } from "../models/User";

const ACKNOWLEDGEMENT_GRACE_MINUTES = 10;

export const startUnacknowledgedReminderCron = () => {
  cron.schedule("*/5 * * * *", async () => {
    const threshold = new Date(Date.now() - ACKNOWLEDGEMENT_GRACE_MINUTES * 60 * 1000);

    try {
      // 1. Fetch sent reminders the patient still hasn't acknowledged, past the grace period
      const reminders = await Reminder.find({
        isSent: true,
        isAcknowledged: { $ne: true },
        reminderAlertSent: { $ne: true },
        scheduledTime: { $lt: threshold },
      }).populate("patient caregiver");

      if (reminders.length === 0) return;

      // 2. Map through reminders to create an array of execution promises
      const reminderPromises = reminders.map(async (reminder) => {
        try {
          const patient = reminder.patient as unknown as IMongooseBaseUser;
          const caregiver = reminder.caregiver as unknown as IMongooseBaseUser;

          // 3. Notify the assigned caregiver
          const tokens: string[] = caregiver?.fcmTokens || [];

          if (tokens.length > 0) {
            const detail = reminder.medicineName || reminder.doctorName || "your reminder";
            await sendPush(
              tokens,
              "Reminder Not Acknowledged",
              `${patient?.name} hasn't responded to: ${detail}`
            );
          }

          // 4. Flag so we don't re-alert every cron tick
          reminder.reminderAlertSent = true;
          await reminder.save();

        } catch (individualError) {
          console.error(`Error processing unacknowledged reminder ID: ${reminder._id}`, individualError);
        }
      });

      // 5. Execute all reminder processes concurrently for better performance
      await Promise.allSettled(reminderPromises);
      console.log(`Unacknowledged reminder cron: processed ${reminders.length} unacknowledged reminder(s)`);

    } catch (error) {
      console.error("Critical Unacknowledged Reminder Cron Error:", error);
    }
  });
};
