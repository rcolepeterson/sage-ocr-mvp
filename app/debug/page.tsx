/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAuth } from "@/lib/firebase/AuthContext";
import { resetOnboarding } from "@/lib/firebase/users";
import { auth } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/firestore";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useState } from "react";

function ResetOnboardingTool() {
  const { user } = useAuth();
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (!user) return;
    await resetOnboarding(user.uid);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <div className="border rounded-xl p-4 flex items-center justify-between mb-4">
      <div>
        <p className="font-medium text-sm">Reset Onboarding</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Clears your onboardingCompletedAt flag — modal will show on next page
          load. Or use{" "}
          <code className="bg-gray-100 px-1 rounded text-orange-500">
            ?onboarding=preview
          </code>{" "}
          for a non-destructive preview.
        </p>
      </div>
      <button
        onClick={handleReset}
        className="ml-4 shrink-0 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
      >
        {done ? "✅ Reset!" : "Reset"}
      </button>
    </div>
  );
}

export default function DebugPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailResult, setEmailResult] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  async function handleSendTestEmail() {
    setEmailResult(null);
    setEmailLoading(true);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: "Sage — Test Email",
          html: `<h1>🌿 Sage Email Test</h1><p>This is a test email from the Sage plant care app. If you received this, email notifications are working correctly.</p>`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailResult("✅ Test email sent! Check your inbox.");
      } else {
        setEmailResult(`❌ Error: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      setEmailResult(`❌ Error: ${err.message || "Unknown error"}`);
    } finally {
      setEmailLoading(false);
    }
  }

  const isGoogleUser = user?.providerData?.some(
    (p) => p.providerId === "google.com",
  );

  const handleClearDisplayName = async () => {
    setStatus(null);
    setError(null);
    try {
      if (!user?.uid) throw new Error("No user UID");
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: null });
      }
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
      <main className="min-h-screen flex flex-col items-center justify-start px-4 pt-10">
        <div className="card p-6 w-full max-w-md text-center">
          <ResetOnboardingTool />

          <div className="border border-gray-200 rounded-lg p-4 mb-4 text-left">
            <a
              href="/terms?preview=true"
              className="text-sm text-swansons-navy underline"
            >
              /terms?preview=true — Terms & Conditions page
            </a>

            <a
              href="/onboarding?onboarding=preview"
              className="text-sm text-swansons-navy underline"
            >
              /onboarding?onboarding=preview — Welcome / Name capture page
            </a>

            <h2 className="font-semibold text-gray-700 mb-2">📧 Email Test</h2>
            <p className="text-xs text-gray-500 mb-3">
              Send a test email using Resend to confirm email notifications are
              working.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center mb-2">
              <input
                type="email"
                className="input w-full text-sm"
                placeholder="Recipient email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={emailLoading}
              />
              <button
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition w-full sm:w-auto disabled:opacity-60"
                onClick={handleSendTestEmail}
                disabled={!email || emailLoading}
              >
                {emailLoading ? "Sending..." : "Send Test Email"}
              </button>
            </div>
            {emailResult && (
              <div className="mt-2 text-sm text-center">{emailResult}</div>
            )}
          </div>

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
