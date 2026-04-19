"use client";

import { useState, useEffect } from "react";
import { getUser, setNotificationsDeclined } from "@/lib/firebase/users";
import { initFcm } from "@/lib/firebase/messaging";

interface Props {
  uid: string;
  /** Text shown when notifications are not yet granted. */
  message: string;
  /**
   * When false the banner is hidden entirely.
   * Use this to only show the banner after a specific user action.
   */
  show?: boolean;
}

/**
 * Dismissible notification permission banner.
 *
 * - Shows an "Enable notifications" prompt when permission is "default".
 * - Shows a "Notifications are blocked" message when permission is "denied".
 * - Never shows when permission is already "granted".
 * - Never shows when the user has previously dismissed it
 *   (notificationsDeclined stored in Firestore).
 */
export default function NotificationBanner({
  uid,
  message,
  show = true,
}: Props) {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if (!show) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    const perm = Notification.permission;
    // Already granted — never show
    if (perm === "granted") return;

    getUser(uid).then((userDoc) => {
      if (userDoc?.notificationsDeclined) return;
      setPermission(perm);
      setReady(true);
    });
  }, [uid, show]);

  const handleEnable = async () => {
    setDismissed(true);
    // initFcm requests permission and saves the token
    await initFcm(uid);
  };

  const handleDismiss = async () => {
    setDismissed(true);
    await setNotificationsDeclined(uid);
  };

  if (!show || !ready || dismissed) return null;

  // ─── Blocked: guide the user to unblock in browser settings ───────────
  if (permission === "denied") {
    return (
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 w-full">
        <span className="text-lg shrink-0 mt-0.5">🔔</span>
        <p className="flex-1 text-sm text-amber-800">
          Notifications are blocked. To enable: click the icon at the left of
          your address bar (🔒 or <strong>ⓘ</strong>) →{" "}
          <strong>Notifications</strong> → <strong>Allow</strong>, then refresh.
        </p>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-amber-500 hover:text-amber-700 text-lg leading-none"
        >
          ✕
        </button>
      </div>
    );
  }

  // ─── Default: ask for permission via user gesture ──────────────────────
  return (
    <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 w-full">
      <span className="text-lg shrink-0 mt-0.5">🔔</span>
      <div className="flex-1">
        <p className="text-sm text-green-800 mb-2">{message}</p>
        <button
          onClick={handleEnable}
          className="text-sm font-medium text-white bg-green-700 hover:bg-green-800 active:bg-green-900 rounded-md px-3 py-1.5"
        >
          Enable notifications
        </button>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-green-400 hover:text-green-700 text-lg leading-none"
      >
        ✕
      </button>
    </div>
  );
}
