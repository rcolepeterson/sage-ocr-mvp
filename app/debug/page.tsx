/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAuth } from "@/lib/firebase/AuthContext";
import { resetOnboarding } from "@/lib/firebase/users";
import { auth } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/firestore";
import { updateProfile } from "firebase/auth";
import {
  doc,
  updateDoc,
  deleteField,
  collection,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useState, useCallback } from "react";

function CleanupMyDataTool() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handleCleanup = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const threadsSnap = await getDocs(collection(db, "threads"));
      await Promise.all(
        threadsSnap.docs
          .filter((d) => d.data().userId === user.uid)
          .map(async (threadDoc) => {
            const repliesSnap = await getDocs(
              collection(db, "threads", threadDoc.id, "replies"),
            );
            await Promise.all(repliesSnap.docs.map((r) => deleteDoc(r.ref)));
            await deleteDoc(threadDoc.ref);
          }),
      );
      const spacesSnap = await getDocs(
        collection(db, `users/${user.uid}/spaces`),
      );
      await Promise.all(
        spacesSnap.docs.map(async (spaceDoc) => {
          const plantsSnap = await getDocs(
            collection(db, `users/${user.uid}/spaces/${spaceDoc.id}/plants`),
          );
          await Promise.all(plantsSnap.docs.map((p) => deleteDoc(p.ref)));
          await deleteDoc(spaceDoc.ref);
        }),
      );
      setDone(true);
      setConfirm(false);
      setTimeout(() => setDone(false), 3000);
    } catch (err: any) {
      console.error("Cleanup error:", err);
    }
    setLoading(false);
  }, [user]);

  if (done) return <p className="text-xs text-green-600">✅ Data deleted.</p>;

  if (confirm)
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-red-500">
          This cannot be undone. All your test threads, spaces and plants will
          be deleted.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleCleanup}
            disabled={loading}
            className="flex-1 text-xs bg-red-500 text-white py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Confirm Delete"}
          </button>
          <button
            onClick={() => setConfirm(false)}
            className="flex-1 text-xs bg-gray-100 text-gray-600 py-2 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    );

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-xs bg-red-50 text-red-600 border border-red-200 py-2 px-4 rounded-lg w-full hover:bg-red-100 transition"
    >
      Delete My Test Data
    </button>
  );
}

export default function DebugPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailResult, setEmailResult] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  const isGoogleUser = user?.providerData?.some(
    (p) => p.providerId === "google.com",
  );

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
          html: `<h1>🌿 Sage Email Test</h1><p>This is a test email from Sage. If you received this, email is working correctly.</p>`,
        }),
      });
      const data = await res.json();
      setEmailResult(
        res.ok && data.success
          ? "✅ Sent! Check your inbox."
          : `❌ ${data.error || "Unknown error"}`,
      );
    } catch (err: any) {
      setEmailResult(`❌ ${err.message}`);
    } finally {
      setEmailLoading(false);
    }
  }

  const handleResetOnboarding = async () => {
    if (!user) return;
    await resetOnboarding(user.uid);
    setOnboardingDone(true);
    setTimeout(() => setOnboardingDone(false), 3000);
  };

  const handleClearDisplayName = async () => {
    setStatus(null);
    setError(null);
    try {
      if (!user?.uid) throw new Error("No user UID");
      if (auth.currentUser)
        await updateProfile(auth.currentUser, { displayName: null });
      await updateDoc(doc(db, "users", user.uid), {
        displayName: deleteField(),
      });
      setStatus("Cleared. Reloading...");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setError(err.message || "Error");
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <main className="min-h-screen bg-white px-4 pt-10 pb-20">
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <h1 className="text-base font-semibold text-swansons-navy mb-1">
            Debug Tools
          </h1>
          <p className="text-xs text-swansons-muted mb-8">
            Admin only — not visible to customers
          </p>

          {/* Preview Links */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-swansons-muted mb-3">
              Preview
            </p>
            <div className="flex flex-col gap-2">
              {[
                {
                  href: "/dashboard?onboarding=preview",
                  label: "Onboarding modal",
                },
                {
                  href: "/onboarding?onboarding=preview",
                  label: "Welcome page",
                },
                { href: "/terms?preview=true", label: "Terms & Conditions" },
              ].map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="flex items-center justify-between bg-swansons-cream rounded-lg px-4 py-3 text-sm text-swansons-navy hover:bg-swansons-green-muted/50 transition"
                >
                  <span>{label}</span>
                  <span className="text-swansons-muted text-xs">→</span>
                </a>
              ))}
            </div>
          </div>

          {/* Reset Tools */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-swansons-muted mb-3">
              Reset
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between bg-swansons-cream rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-swansons-navy">
                    Onboarding modal
                  </p>
                  <p className="text-xs text-swansons-muted">
                    Shows again on next page load
                  </p>
                </div>
                <button
                  onClick={handleResetOnboarding}
                  className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition ml-4 shrink-0"
                >
                  {onboardingDone ? "✅ Done" : "Reset"}
                </button>
              </div>

              {!isGoogleUser ? (
                <div className="flex items-center justify-between bg-swansons-cream rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-swansons-navy">
                      Display name
                    </p>
                    <p className="text-xs text-swansons-muted">
                      Triggers name capture on reload
                    </p>
                  </div>
                  <button
                    onClick={handleClearDisplayName}
                    className="text-xs bg-white border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition ml-4 shrink-0"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  ⚠️ Google account — display name cannot be cleared.
                </p>
              )}

              {status && (
                <p className="text-xs text-green-600 px-1">{status}</p>
              )}
              {error && <p className="text-xs text-red-500 px-1">{error}</p>}
            </div>
          </div>

          {/* Clean Up Data */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-swansons-muted mb-3">
              Data
            </p>
            <div className="bg-swansons-cream rounded-lg px-4 py-3">
              <p className="text-sm font-medium text-swansons-navy mb-1">
                Clean up test data
              </p>
              <p className="text-xs text-swansons-muted mb-3">
                Deletes your threads, spaces and plants
              </p>
              <CleanupMyDataTool />
            </div>
          </div>

          {/* Email Test */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-swansons-muted mb-3">
              Email
            </p>
            <div className="bg-swansons-cream rounded-lg px-4 py-3">
              <p className="text-sm font-medium text-swansons-navy mb-3">
                Send test email
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  className="input flex-1 text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={emailLoading}
                />
                <button
                  onClick={handleSendTestEmail}
                  disabled={!email || emailLoading}
                  className="text-xs bg-swansons-navy text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:opacity-90 transition shrink-0"
                >
                  {emailLoading ? "..." : "Send"}
                </button>
              </div>
              {emailResult && (
                <p className="text-xs mt-2 text-swansons-muted">
                  {emailResult}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
