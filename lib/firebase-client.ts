import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export async function requestNotificationToken(): Promise<string | null> {
  try {
    const supported = await isSupported();
    console.log("[FCM] isSupported:", supported);
    if (!supported) return null;
    const permission = await Notification.requestPermission();
    console.log("[FCM] permission:", permission);
    if (permission !== "granted") return null;
    const messaging = getMessaging(app);
    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: reg,
    });
    console.log("[FCM] token:", token ? token.slice(0, 20) + "..." : null);

    // Foreground message handler — show system notification when tab is active
    onMessage(messaging, ({ notification }) => {
      if (!notification) return;
      new Notification(notification.title ?? "Catatanku", {
        body: notification.body ?? "",
        icon: "/icon-192.png",
      });
    });

    return token || null;
  } catch (err) {
    console.error("[FCM] error:", err);
    return null;
  }
}
