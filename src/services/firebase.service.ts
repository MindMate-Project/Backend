import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

export const sendPush = async (
  tokens: string[],
  title: string,
  body: string
) => {
  if (!tokens || tokens.length === 0) return;

  const message = {
    notification: { title, body },
    tokens,
  };

  try {
    await admin.messaging().sendEachForMulticast(message);
  } catch (error) {
    console.error("Push error:", error);
  }
};