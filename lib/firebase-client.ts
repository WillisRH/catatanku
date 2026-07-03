import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

let foregroundListenerSetup = false;

/** Registers the foreground message listener exactly once */
function registerForegroundListener(messaging: Messaging) {
  if (foregroundListenerSetup) return;
  foregroundListenerSetup = true;

  onMessage(messaging, (payload) => {
    console.log("[FCM] foreground message received:", payload);
    const title = payload.notification?.title ?? payload.data?.title ?? "Catatanku";
    const body = payload.notification?.body ?? payload.data?.body ?? "";

    // Show browser notification when tab is active
    try {
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/icon.svg" });
      }
    } catch (e) {
      console.warn("[FCM] native notification error:", e);
    }

    // Dispatch custom event for in-app toast
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("fcm-notification", {
          detail: { title, body },
        })
      );
    }
  });
  console.log("[FCM] foreground listener registered");
}

/** Call this early on page load to ensure foreground messages are captured */
export async function setupForegroundListener(): Promise<void> {
  try {
    const supported = await isSupported();
    if (!supported) return;
    if (Notification.permission !== "granted") return;
    const messaging = getMessaging(app);
    registerForegroundListener(messaging);
  } catch (err) {
    console.warn("[FCM] setupForegroundListener error:", err);
  }
}

export async function requestNotificationToken(): Promise<string | null> {
  try {
    const supported = await isSupported();
    console.log("[FCM] isSupported:", supported);
    if (!supported) return null;
    const permission = await Notification.requestPermission();
    console.log("[FCM] permission:", permission);
    if (permission !== "granted") return null;
    const messaging = getMessaging(app);
    await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const reg = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: reg,
    });
    console.log("[FCM] token:", token ? token.slice(0, 20) + "..." : null);

    // Also register foreground listener here in case setupForegroundListener wasn't called
    registerForegroundListener(messaging);

    return token || null;
  } catch (err) {
    console.error("[FCM] error:", err);
    return null;
  }
}
