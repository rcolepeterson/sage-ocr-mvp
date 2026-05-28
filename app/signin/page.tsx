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
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";

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

  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && user) {
      const returnTo = searchParams.get("returnTo");
      router.push(returnTo ? decodeURIComponent(returnTo) : "/dashboard");
    }
  }, [user, loading, router, searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible", callback: () => {} },
      );
    }
  }, []);

  const getRecaptchaVerifier = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible", callback: () => {} },
      );
    }
    return (window as any).recaptchaVerifier;
  };

  const handleSendPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPhoneLoading(true);
    try {
      const appVerifier = getRecaptchaVerifier();
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
      if (
        e.code === "auth/invalid-credential" ||
        e.code === "auth/user-not-found" ||
        e.code === "auth/wrong-password"
      ) {
        setError(
          "Invalid email or password. Please try again or create an account.",
        );
      } else if (e.code === "auth/email-already-in-use") {
        setError("Email already in use.");
      } else if (e.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (e.code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else {
        setError("Something went wrong. Please try again.");
      }
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

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-swansons-cream">
      <div id="recaptcha-container" />

      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin w-8 h-8 border-2 border-swansons-green border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="card p-8 w-full max-w-md text-center">
          <div className="flex justify-center mb-4">
            <Logo width={120} height={60} />
          </div>
          {/* <p className="font-body text-swansons-black mb-8">
            Swansons Nursery Plant Care
          </p> */}

          {(mode === "signin" || mode === "signup") && (
            <>
              <form
                onSubmit={
                  phoneStep === "input"
                    ? handleSendPhoneCode
                    : handleVerifyPhoneCode
                }
                className="mb-5"
              >
                <label className="block text-xs font-medium mb-1 text-swansons-black text-left">
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
                      className="rounded-full bg-swansons-navy text-white px-4 py-2 hover:bg-[color-mix(in_srgb,var(--color-swansons-navy)_90%,black)] transition"
                      disabled={phoneLoading}
                    >
                      {phoneLoading ? "Sending..." : "Send Code"}
                    </button>
                  </div>
                )}
                {phoneStep === "code" && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-swansons-black text-left">
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
                      className="rounded-full bg-swansons-navy text-white px-4 py-2 hover:bg-[color-mix(in_srgb,var(--color-swansons-navy)_90%,black)] transition"
                      disabled={phoneLoading}
                    >
                      {phoneLoading ? "Verifying..." : "Verify Code"}
                    </button>
                    <button
                      type="button"
                      className="text-xs text-swansons-black underline"
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
              </form>

              {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

              <button
                onClick={signInWithGoogle}
                className="w-full rounded-full bg-swansons-navy text-white px-6 py-3 hover:bg-[color-mix(in_srgb,var(--color-swansons-navy)_90%,black)] transition mb-4"
              >
                Sign in with Google
              </button>

              <div className="my-4 flex items-center">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="mx-3 text-swansons-black text-xs">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-3 text-left">
                <div>
                  <label className="block text-xs font-medium mb-1 text-swansons-black">
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
                  <label className="block text-xs font-medium mb-1 text-swansons-black">
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
                  className="w-full rounded-full bg-swansons-navy text-white px-6 py-3 hover:bg-[color-mix(in_srgb,var(--color-swansons-navy)_90%,black)] transition disabled:opacity-50"
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
                  className="text-xs text-swansons-navy underline cursor-pointer"
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
                  className="text-xs text-swansons-navy underline cursor-pointer"
                >
                  Forgot your password?
                </button>
              </div>
            </>
          )}

          {mode === "reset" && (
            <>
              <h2 className="text-lg font-medium mb-2 text-swansons-black">
                Reset Password
              </h2>
              <p className="text-sm text-swansons-black mb-6">
                Enter your email and we&apos;ll send you a reset link.
              </p>
              {resetSent ? (
                <div className="text-center">
                  <span className="text-3xl block mb-3">📧</span>
                  <p className="text-green-700 font-medium mb-2">
                    Reset email sent!
                  </p>
                  <p className="text-xs text-swansons-black mb-6">
                    Check your inbox for the reset link.
                  </p>
                  <button
                    onClick={() => {
                      setMode("signin");
                      setResetSent(false);
                      setEmail("");
                    }}
                    className="w-full rounded-full bg-swansons-navy text-white px-6 py-3 hover:bg-[color-mix(in_srgb,var(--color-swansons-navy)_90%,black)] transition"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-3 text-left">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-swansons-black">
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
                    className="w-full rounded-full bg-swansons-navy text-white px-6 py-3 hover:bg-[color-mix(in_srgb,var(--color-swansons-navy)_90%,black)] transition disabled:opacity-50"
                  >
                    {submitting ? "Sending..." : "Send Reset Email"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setError(null);
                    }}
                    className="w-full text-sm text-swansons-black mt-2 cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </form>
              )}
            </>
          )}

          <p className="text-xs text-swansons-black mt-6">
            On iPhone? If you see passkey options, tap{" "}
            <span className="font-medium">&quot;Other accounts&quot;</span> to
            sign in with Google.
          </p>
        </div>
      )}
    </main>
  );
}
