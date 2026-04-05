/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/firebase/AuthContext";
import { auth } from "@/lib/firebase/auth";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { updateProfile } from "firebase/auth";
import { useState } from "react";

export default function DebugPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isGoogleUser = user?.providerData?.some(
    (p) => p.providerId === "google.com",
  );

  const handleClearDisplayName = async () => {
    setStatus(null);
    setError(null);
    try {
      if (!user?.uid) throw new Error("No user UID");
      // Clear displayName in Firebase Auth
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: null });
      }
      // Delete displayName from Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { displayName: deleteField() });
      setStatus("Display name cleared. Reloading...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Error clearing display name");
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <main className="min-h-screen flex flex-col items-center justify-start bg-swansons-cream px-4 pt-10">
        <div className="card p-6 w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">DEV TOOLS</h1>

          <div className="border border-gray-200 rounded-lg p-4 mb-4 text-left">
            <h2 className="font-semibold text-gray-700 mb-2">
              Clear Display Name
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              Clears your display name from Firebase Auth and Firestore,
              triggering the onboarding flow on reload.
            </p>

            {isGoogleUser ? (
              <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded p-3">
                ⚠️ You are signed in with Google. Clearing your display name
                won&apos;t work correctly as Google will restore it on next
                sign-in. Use a test email/password account instead.
              </p>
            ) : (
              <button
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded w-full transition"
                onClick={handleClearDisplayName}
              >
                Clear Display Name
              </button>
            )}
          </div>

          {status && <p className="text-green-600 mt-2">{status}</p>}
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>
      </main>
    </ProtectedRoute>
  );
}
