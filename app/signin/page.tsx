"use client";

import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { useAuth } from "@/lib/firebase/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SignInPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Email/password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      setError(e.message || "Google sign-in failed");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    setResetSent(false);
    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e: any) {
      if (e.code === "auth/user-not-found")
        setError("No account found for this email.");
      else if (e.code === "auth/wrong-password")
        setError("Incorrect password.");
      else if (e.code === "auth/email-already-in-use")
        setError("Email already in use.");
      else if (e.code === "auth/invalid-email")
        setError("Invalid email address.");
      else if (e.code === "auth/weak-password")
        setError("Password should be at least 6 characters.");
      else setError(e.message || "Authentication error");
    }
    setSubmitting(false);
  };

  const handleReset = async () => {
    setError(null);
    setResetSent(false);
    if (!email) {
      setError("Enter your email to reset password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (e: any) {
      if (e.code === "auth/user-not-found")
        setError("No account found for this email.");
      else setError(e.message || "Failed to send reset email");
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <main className="min-h-screen flex items-center justify-center bg-swansons-cream px-4">
      <div className="card p-8 w-full max-w-md text-center">
        <span className="text-5xl mb-3 block">🌿</span>
        <h1 className="text-2xl mb-1">Welcome to Sage</h1>
        <p className="text-swansons-muted mb-8">Swansons Nursery Plant Care</p>
        <button
          onClick={signInWithGoogle}
          className="w-full rounded-full bg-green-700 text-white px-6 py-3 hover:bg-green-800 transition"
        >
          Sign in with Google
        </button>
        <div className="my-6 flex items-center">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="mx-3 text-gray-400 text-xs">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
          <label className="block text-xs font-medium mb-1 text-gray-600">
            Email
          </label>
          <input
            type="email"
            className="input w-full"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label className="block text-xs font-medium mb-1 text-gray-600">
            Password
          </label>
          <input
            type="password"
            className="input w-full"
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className="text-red-600 text-xs mb-2">{error}</div>}
          {resetSent && (
            <div className="text-green-700 text-xs mb-2">
              Password reset email sent!
            </div>
          )}
          <button
            type="submit"
            className="w-full rounded-full bg-green-700 text-white px-6 py-3 hover:bg-green-800 transition mb-2"
            disabled={submitting}
          >
            {mode === "signin"
              ? submitting
                ? "Signing in..."
                : "Sign In"
              : submitting
                ? "Creating account..."
                : "Create Account"}
          </button>
        </form>
        <div className="flex flex-col items-center mt-2 gap-2">
          <button
            type="button"
            className="text-xs text-swansons-green underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin"
              ? "Need an account? Create one"
              : "Already have an account? Sign in"}
          </button>
          <button
            type="button"
            className="text-xs text-swansons-green underline"
            onClick={handleReset}
          >
            Forgot password?
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          On iPhone? If you see passkey options, tap{" "}
          <span className="font-medium">&quot;Other accounts&quot;</span> to
          sign in with your Google account.
        </p>
      </div>
    </main>
  );
}
