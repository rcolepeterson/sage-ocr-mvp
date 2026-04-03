"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "./auth";
import { createUserIfNotExists, getUserRole, getUser, UserRole } from "./users";

interface AuthContextType {
  user: (User & { termsAcceptedAt?: any; termsVersion?: string }) | null;
  role: UserRole | null;
  loading: boolean;
}

interface AuthContextWithSetter extends AuthContextType {
  setUser: React.Dispatch<React.SetStateAction<any>>;
}

export const AuthContext = createContext<AuthContextWithSetter>({
  user: null,
  role: null,
  loading: true,
  setUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await createUserIfNotExists(user);
        const userRole = await getUserRole(user.uid);
        setRole(userRole);
        // Fetch Firestore user doc for terms fields
        const userDoc = await getUser(user.uid);
        setUser({
          ...user,
          termsAcceptedAt: userDoc?.termsAcceptedAt || null,
          termsVersion: userDoc?.termsVersion || null,
        });
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
