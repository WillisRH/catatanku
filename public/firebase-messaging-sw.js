importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

// IMPORTANT: Fill in your Firebase public config values below.
// Service workers cannot read NEXT_PUBLIC_ env vars — hardcode is required.
// These are non-secret public values, safe to commit.
firebase.initializeApp({
  apiKey: "AIzaSyD6Hwu0_qOjAt5Q23uKj4eo5lqR5PCox5U",
  authDomain: "twodraw.firebaseapp.com",
  projectId: "twodraw",
  messagingSenderId: "54009865758",
  appId: "1:54009865758:web:b118381efb10fb69bbf00f",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(({ notification }) => {
  if (!notification) return;
  self.registration.showNotification(notification.title ?? "Catatanku", {
    body: notification.body ?? "",
    icon: "/icon-192.png",
  });
});
