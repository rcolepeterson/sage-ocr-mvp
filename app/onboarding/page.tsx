"use client";
import { useAuth, AuthContext } from "@/lib/firebase/AuthContext";
import { updateUserDisplayName } from "@/lib/firebase/users";
import { useRouter } from "next/navigation";
import { useState, useContext, useEffect } from "react";

export default function OnboardingPage() {
  const { user } = useAuth();
  const authCtx = useContext(AuthContext);
  const router = useRouter();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // If user already has displayName, redirect home
    if (user && user.displayName) {
      router.replace("/");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSubmitting(true);
    await updateUserDisplayName(user.uid, name.trim(), user);
    // Patch AuthContext user state immediately
    if (authCtx && typeof authCtx.setUser === "function") {
      authCtx.setUser({
        ...user,
        displayName: name.trim(),
      });
    }
    setSubmitting(false);
    router.replace("/");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-swansons-cream px-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Welcome!</h1>
        <div className="prose prose-sm max-w-none mb-6 text-gray-700">
          <p>Let’s get started. What’s your name?</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="input w-full text-lg px-4 py-3 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            maxLength={40}
            required
            autoFocus
          />
          <button
            type="submit"
            className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-800 transition disabled:opacity-50"
            disabled={submitting || !name.trim()}
          >
            {submitting ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
