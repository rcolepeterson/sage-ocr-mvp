// /lib/firebase/messaging.ts
// Client-side FCM token management.
// Called from the NotificationBanner after the user grants permission.

import { getMessaging, getToken, onMessage } from "firebase/messaging";
import app from "./config";
import { saveFcmToken } from "./users";

let foregroundHandlerSetup = false;

/**
 * Sets up a foreground message handler so notifications appear when the
 * app tab is active. The service worker's onBackgroundMessage only fires
 * when the tab is not focused — this covers the other case.
 */
function setupForegroundHandler() {
  if (foregroundHandlerSetup) return;
  foregroundHandlerSetup = true;

  const messaging = getMessaging(app);
  onMessage(messaging, async (payload) => {
    console.log("[FCM] foreground message received:", payload);
    const title = payload.notification?.title || "Sage";
    const body = payload.notification?.body || "";
    console.log("[FCM] showing foreground notification:", {
      title,
      body,
      permission: Notification.permission,
    });
    if (Notification.permission !== "granted") {
      console.warn(
        "[FCM] cannot show notification — permission is:",
        Notification.permission,
      );
      return;
    }
    // new Notification() is blocked by Chrome when a service worker is active.
    // Must use registration.showNotification() instead.
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification(title, { body });
  });
}

/**
 * Waits for a specific SW registration to become active.
 * Do NOT use navigator.serviceWorker.ready — that resolves to whichever SW
 * is currently controlling the page, which may not be the Firebase one.
 */
async function waitForActive(
  reg: ServiceWorkerRegistration,
): Promise<ServiceWorkerRegistration> {
  if (reg.active) return reg;
  return new Promise((resolve, reject) => {
    const sw = reg.installing || reg.waiting;
    if (!sw) {
      reject(new Error("[FCM] No SW in installing or waiting state"));
      return;
    }
    const onStateChange = () => {
      if (sw.state === "activated") {
        sw.removeEventListener("statechange", onStateChange);
        resolve(reg);
      } else if (sw.state === "redundant") {
        sw.removeEventListener("statechange", onStateChange);
        reject(new Error("[FCM] Service worker became redundant"));
      }
    };
    sw.addEventListener("statechange", onStateChange);
  });
}

/**
 * Requests notification permission, registers the service worker,
 * retrieves the FCM token, and stores it in Firestore under the user's
 * document so the server can send targeted push notifications.
 *
 * Safe to call when the user explicitly enables notifications.
 */
export async function initFcm(uid: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (!("serviceWorker" in navigator)) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("[FCM] permission not granted:", permission);
      return;
    }

    // Register the service worker served by the dynamic Next.js route.
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" },
    );

    // Wait for THIS specific registration to be active.
    // The SW calls skipWaiting() so this resolves quickly.
    const activeRegistration = await waitForActive(registration);
    console.log(
      "[FCM] service worker active:",
      activeRegistration.active?.scriptURL,
    );

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: activeRegistration,
    });

    if (token) {
      console.log("[FCM] token obtained, saving to Firestore");
      await saveFcmToken(uid, token);
    } else {
      console.warn(
        "[FCM] no token returned — check VAPID key and SW registration",
      );
    }

    // Handle notifications when the app tab is in the foreground
    setupForegroundHandler();
  } catch (err) {
    // Non-fatal — notifications are best-effort.
    console.error("[FCM] init failed:", err);
  }
}
