import admin from "firebase-admin";
import { User } from "../models/user";
import serviceAccount from "../../service-account-key.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
});

export const sendPushNotification = async (
  userId: string,
  message: string,
  retries = 3
): Promise<void> => {
  const user = await User.findOne({ userId });
  if (!user?.fcmToken || !user.notificationPreferences.push) return;
  const payload = {
    notification: {
      title: "Order Update",
      body: message,
    },
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await admin.messaging().send({
        token: user.fcmToken,
        notification: payload.notification,
      });
      console.log(`Notification sent to ${userId}: ${message}`);
      return;
    } catch (error) {
      console.error(
        `Attempt ${attempt} to send notification to ${userId} failed:`,
        error
      );
      if (attempt < retries)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  console.error(
    `Failed to send notification to ${userId} after ${retries} attempts`
  );
};
