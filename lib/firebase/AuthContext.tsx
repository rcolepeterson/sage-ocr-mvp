/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "./auth";
import { createUserIfNotExists, getUserRole, getUser, UserRole } from "./users";
import { initFcm } from "./messaging";

type ExtendedUser = User & {
  termsAcceptedAt?: any;
  termsVersion?: string | null;
  specialty?: string | null;
};

interface AuthContextType {
  user: ExtendedUser | null;
  role: UserRole | null;
  loading: boolean;
}

interface AuthContextWithSetter extends AuthContextType {
  setUser: React.Dispatch<React.SetStateAction<ExtendedUser | null>>;
}

export const AuthContext = createContext<AuthContextWithSetter>({
  user: null,
  role: null,
  loading: true,
  setUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await createUserIfNotExists(user);
        const userRole = await getUserRole(user.uid);
        setRole(userRole);
        // Fetch Firestore user doc for terms fields and custom display data
        const userDoc = await getUser(user.uid);
        setUser({
          ...user,
          photoURL: userDoc?.photoURL || user.photoURL,
          displayName: userDoc?.displayName || user.displayName,
          termsAcceptedAt: userDoc?.termsAcceptedAt || null,
          termsVersion: userDoc?.termsVersion || null,
          specialty: userDoc?.specialty || null,
        });
        // If the user has already granted notification permission, silently
        // refresh the FCM token on every sign-in. This keeps the token fresh
        // after service worker reinstalls or browser updates.
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          initFcm(user.uid).catch(console.error);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
