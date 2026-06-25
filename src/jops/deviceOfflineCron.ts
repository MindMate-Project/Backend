import cron from "node-cron";
import { Caregiver, Patient } from "../models/User";
import Alert from "../models/Alert";
import { sendPush } from "../services/firebase.service";

const OFFLINE_THRESHOLD_MINUTES = 10;

export const startDeviceOfflineCron = () => {
  cron.schedule("*/5 * * * *", async () => {
    const threshold = new Date(Date.now() - OFFLINE_THRESHOLD_MINUTES * 60 * 1000);

    try {
      // 1. Find patients with an assigned device that has gone quiet and
      // hasn't already triggered an alert.
      const offlinePatients = await Patient.find({
        "device.deviceId": { $exists: true },
        "device.timestamp": { $lt: threshold },
        "device.offlineAlertSent": { $ne: true },
      });

      if (offlinePatients.length === 0) return;

      const offlinePromises = offlinePatients.map(async (patient) => {
        try {
          // 2. Record the alert and notify caregivers.
          await Alert.create({
            patient_id: patient._id,
            alert_type: "device_offline",
            timestamp: new Date(),
          });

          const caregivers = await Caregiver.find({
            _id: { $in: patient.caregivers },
          }).select("fcmTokens");
          const tokens: string[] = caregivers.flatMap((caregiver) => caregiver.fcmTokens || []);

          if (tokens.length > 0) {
            await sendPush(
              tokens,
              "Device Offline",
              `${patient.name}'s tracking device stopped responding`
            );
          }

          // 3. Flag so we don't re-alert every cron tick while still offline.
          patient.device.offlineAlertSent = true;
          await patient.save();

        } catch (individualError) {
          console.error(`Error processing offline device for patient ID: ${patient._id}`, individualError);
        }
      });

      await Promise.allSettled(offlinePromises);
      console.log(`Device offline cron: processed ${offlinePatients.length} offline device(s)`);

    } catch (error) {
      console.error("Critical Device Offline Cron Error:", error);
    }
  });
};
