"use client";

import {
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { useAuth } from "@/lib/firebase/AuthContext";

export default function SignInButton() {
  const { user, loading } = useAuth();

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const isLocalhost = window.location.hostname === "localhost";
      if (isLocalhost) {
        await signInWithPopup(auth, provider);
      } else {
        await signInWithRedirect(auth, provider);
      }
    } catch (error) {
      console.error("🚨 Sign in error:", error);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  if (loading) return <p className="text-center">Loading...</p>;

  if (user)
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-swansons-muted">Welcome {user.displayName}</p>
        <button
          onClick={handleSignOut}
          className="w-full rounded-full border border-swansons-muted px-6 py-2 text-swansons-muted hover:bg-gray-100 transition"
        >
          Sign Out
        </button>
      </div>
    );

  return (
    <div className="flex justify-center">
      <button
        onClick={signInWithGoogle}
        className="w-full rounded-full bg-green-700 text-white px-6 py-3 hover:bg-green-800 transition"
      >
        Sign in with Google
      </button>
    </div>
  );
}
