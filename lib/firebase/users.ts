/* eslint-disable @typescript-eslint/no-explicit-any */
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firestore";
import type { User as FirebaseUser } from "firebase/auth";

export type UserRole = "customer" | "staff" | "admin";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: any;
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
