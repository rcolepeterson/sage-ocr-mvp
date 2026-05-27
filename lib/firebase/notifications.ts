import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firestore";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: "broadcast" | "reply" | "system";
  read: boolean;
  createdAt: Timestamp;
  broadcastId?: string;
  threadId?: string;
}

function thirtyDaysAgo(): Date {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
}

// Get all notifications for a user (last 30 days, newest first)
export async function getNotificationsForUser(
  userId: string,
): Promise<Notification[]> {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    where("createdAt", ">=", Timestamp.fromDate(thirtyDaysAgo())),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Notification,
  );
}

// Real-time listener for the home page notification carousel
export function onNotificationsSnapshot(
  userId: string,
  callback: (notifications: Notification[]) => void,
): () => void {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    where("createdAt", ">=", Timestamp.fromDate(thirtyDaysAgo())),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snap) => {
    const notifications = snap.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Notification,
    );
    callback(notifications);
  });
}

// Mark a single notification as read — called when slide becomes active
export async function markNotificationAsRead(
  notificationId: string,
): Promise<void> {
  const ref = doc(db, "notifications", notificationId);
  await updateDoc(ref, { read: true });
}

// Derive unread count from a notifications array — no extra Firestore read needed
export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.read).length;
}
