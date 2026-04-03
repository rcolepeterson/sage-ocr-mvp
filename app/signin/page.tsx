/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { useAuth } from "@/lib/firebase/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Mode = "signin" | "signup" | "reset";

export default function SignInPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("signin");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneStep, setPhoneStep] = useState<"input" | "code" | "done">(
    "input",
  );
  const [phoneResult, setPhoneResult] = useState<ConfirmationResult | null>(
    null,
  );
  const [phoneLoading, setPhoneLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).recaptchaVerifier) return;
    (window as any).recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      { size: "invisible", callback: () => {} },
    );
  }, []);

  const handleSendPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPhoneLoading(true);
    try {
      const appVerifier = (window as any).recaptchaVerifier;
      const formatted = phone.startsWith("+")
        ? phone
        : `+1${phone.replace(/[^\d]/g, "")}`;
      const result = await signInWithPhoneNumber(auth, formatted, appVerifier);
      setPhoneResult(result);
      setPhoneStep("code");
    } catch (e: any) {
      if (e.code === "auth/invalid-phone-number")
        setError("Invalid phone number.");
      else setError(e.message || "Failed to send code.");
      (window as any).recaptchaVerifier = null;
    }
    setPhoneLoading(false);
  };

  const handleVerifyPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPhoneLoading(true);
    try {
      if (!phoneResult) throw new Error("No verification in progress.");
      await phoneResult.confirm(phoneCode);
    } catch (e: any) {
      if (e.code === "auth/invalid-verification-code")
        setError("Invalid code. Please try again.");
      else setError(e.message || "Failed to verify code.");
    }
    setPhoneLoading(false);
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      setError("Google sign-in failed. Please try again.");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
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
        setError("Password must be at least 6 characters.");
      else setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (e: any) {
      if (e.code === "auth/user-not-found")
        setError("No account found for this email.");
      else setError("Failed to send reset email. Please try again.");
    }
    setSubmitting(false);
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <main className="min-h-screen flex items-center justify-center bg-swansons-cream px-4">
      <div className="card p-8 w-full max-w-md text-center">
        <span className="text-5xl mb-3 block">🌿</span>
        <h1 className="text-2xl mb-1">Welcome to Sage</h1>
        <p className="text-swansons-muted mb-8">Swansons Nursery Plant Care</p>

        {/* ── SIGN IN / SIGN UP ── */}
        {(mode === "signin" || mode === "signup") && (
          <>
            {/* Phone */}
            <form
              onSubmit={
                phoneStep === "input"
                  ? handleSendPhoneCode
                  : handleVerifyPhoneCode
              }
              className="mb-5"
            >
              <label className="block text-xs font-medium mb-1 text-gray-600 text-left">
                Phone Number
              </label>
              {phoneStep === "input" && (
                <div className="flex gap-2">
                  <input
                    type="tel"
                    className="input flex-1"
                    placeholder="+1 555 555 5555"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-green-700 text-white px-4 py-2 hover:bg-green-800 transition"
                    disabled={phoneLoading}
                  >
                    {phoneLoading ? "Sending..." : "Send Code"}
                  </button>
                </div>
              )}
              {phoneStep === "code" && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-gray-500 text-left">
                    Code sent to {phone}
                  </p>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="6-digit code"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-green-700 text-white px-4 py-2 hover:bg-green-800 transition"
                    disabled={phoneLoading}
                  >
                    {phoneLoading ? "Verifying..." : "Verify Code"}
                  </button>
                  <button
                    type="button"
                    className="text-xs text-gray-400 underline"
                    onClick={() => {
                      setPhoneStep("input");
                      setPhoneCode("");
                      setPhoneResult(null);
                      if ((window as any).recaptchaVerifier) {
                        (window as any).recaptchaVerifier.clear();
                        (window as any).recaptchaVerifier = null;
                      }
                    }}
                  >
                    Use a different number
                  </button>
                </div>
              )}
              <div id="recaptcha-container" />
            </form>

            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

            {/* Google */}
            <button
              onClick={signInWithGoogle}
              className="w-full rounded-full bg-white border border-gray-200 text-gray-700 px-6 py-3 hover:bg-gray-50 transition mb-4"
            >
              Sign in with Google
            </button>

            {/* Divider */}
            <div className="my-4 flex items-center">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="mx-3 text-gray-400 text-xs">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Email/Password */}
            <form onSubmit={handleEmailAuth} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-600">
                  Email
                </label>
                <input
                  type="email"
                  className="input w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-600">
                  Password
                </label>
                <input
                  type="password"
                  className="input w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-green-700 text-white px-6 py-3 hover:bg-green-800 transition disabled:opacity-50"
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

            <div className="flex flex-col items-center mt-4 gap-2">
              <button
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError(null);
                }}
                className="text-xs text-green-700 underline cursor-pointer"
              >
                {mode === "signin"
                  ? "Need an account? Create one"
                  : "Already have an account? Sign in"}
              </button>
              <button
                onClick={() => {
                  setMode("reset");
                  setError(null);
                }}
                className="text-xs text-green-700 underline cursor-pointer"
              >
                Forgot your password?
              </button>
            </div>
          </>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {mode === "reset" && (
          <>
            <h2 className="text-lg font-medium mb-2">Reset Password</h2>
            <p className="text-sm text-gray-500 mb-6">
              Enter your email and we&apos;ll send you a reset link.
            </p>
            {resetSent ? (
              <div className="text-center">
                <span className="text-3xl block mb-3">📧</span>
                <p className="text-green-700 font-medium mb-2">
                  Reset email sent!
                </p>
                <p className="text-xs text-gray-500 mb-6">
                  Check your inbox for the reset link.
                </p>
                <button
                  onClick={() => {
                    setMode("signin");
                    setResetSent(false);
                    setEmail("");
                  }}
                  className="w-full rounded-full bg-green-700 text-white px-6 py-3 hover:bg-green-800 transition"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-3 text-left">
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-600">
                    Email
                  </label>
                  <input
                    type="email"
                    className="input w-full"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-red-500 text-xs">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-green-700 text-white px-6 py-3 hover:bg-green-800 transition disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Send Reset Email"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                  className="w-full text-sm text-gray-500 mt-2 cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </form>
            )}
          </>
        )}

        <p className="text-xs text-gray-400 mt-6">
          On iPhone? If you see passkey options, tap{" "}
          <span className="font-medium">&quot;Other accounts&quot;</span> to
          sign in with Google.
        </p>
      </div>
    </main>
  );
}
