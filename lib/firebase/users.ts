/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firestore";
import { auth } from "./auth";
import { updateProfile } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";

export type UserRole = "customer" | "staff" | "admin";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: any;
  termsAcceptedAt?: any;
  termsVersion?: string;
  fcmToken?: string;
  notificationsDeclined?: boolean;
}

export async function createUserIfNotExists(user: FirebaseUser) {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    const appUser: AppUser = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      role: "customer",
      createdAt: serverTimestamp(),
    };
    await setDoc(userRef, appUser);
  }
}

export async function getUser(uid: string): Promise<AppUser | null> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;
  return userSnap.data() as AppUser;
}

export async function getUserRole(uid: string): Promise<UserRole | null> {
  const user = await getUser(uid);
  return user?.role || null;
}

// Update displayName in Firestore and Firebase Auth
export async function updateUserDisplayName(uid: string, displayName: string) {
  // Update Firestore
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, { displayName }, { merge: true });

  // Update Firebase Auth profile using auth.currentUser (real Firebase user)
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName }); // ✅ real Firebase user
  }
}

// Save (or refresh) an FCM token for a user
export async function saveFcmToken(uid: string, token: string) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, { fcmToken: token }, { merge: true });
}

// Get FCM tokens for all staff and admin users
export async function getStaffFcmTokens(): Promise<string[]> {
  const q = query(
    collection(db, "users"),
    where("role", "in", ["staff", "admin"]),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => d.data().fcmToken as string | undefined)
    .filter((t): t is string => typeof t === "string" && t.length > 0);
}

// Get the FCM token for a specific user
export async function getUserFcmToken(uid: string): Promise<string | null> {
  const user = await getUser(uid);
  return user?.fcmToken ?? null;
}

// Mark that the user has dismissed the notifications prompt
export async function setNotificationsDeclined(uid: string) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, { notificationsDeclined: true }, { merge: true });
}

// Update user T&C acceptance
export async function updateUserTermsAccepted(uid: string) {
  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      termsAcceptedAt: serverTimestamp(),
      termsVersion: "1.0",
    },
    { merge: true },
  );
}
