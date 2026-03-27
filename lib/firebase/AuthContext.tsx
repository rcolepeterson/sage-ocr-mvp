"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth } from "./auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void;

    const init = async () => {
      try {
        console.log("🔍 Checking redirect result...");
        const result = await getRedirectResult(auth);
        console.log("🔍 Redirect result:", result);
        if (result?.user) {
          console.log("✅ User from redirect:", result.user.email);
          setUser(result.user);
        } else {
          console.log("❌ No redirect result");
        }
      } catch (error) {
        console.error("🚨 Redirect error:", error);
      }

      unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log("🔍 Auth state changed:", user?.email);
        setUser(user);
        setLoading(false);
      });
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
