"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth } from "./auth";
import { createUserIfNotExists, getUserRole, UserRole } from "./users";

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void;

    const init = async () => {
      // Await redirect result FIRST before setting up auth listener
      try {
        await getRedirectResult(auth);
      } catch {
        // ignore
      }

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        setUser(user);
        if (user) {
          await createUserIfNotExists(user);
          const userRole = await getUserRole(user.uid);
          setRole(userRole);
        } else {
          setRole(null);
        }
        setLoading(false);
      });
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
