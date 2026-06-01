"use client";
import { useEffect, useState } from "react";
import { sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { useAuth } from "@/lib/firebase/AuthContext";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

const COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const { user } = useAuth();
  //const router = useRouter();
  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Auto-check every 5 seconds
  //   useEffect(() => {
  //     const interval = setInterval(async () => {
  //       if (!auth.currentUser) return;
  //       await auth.currentUser.reload();
  //       if (auth.currentUser.emailVerified) {
  //         router.replace("/dashboard");
  //       }
  //     }, 5000);
  //     return () => clearInterval(interval);
  //   }, [router]);

  const handleCheckVerification = async () => {
    setChecking(true);
    setError(null);
    try {
      if (!auth.currentUser) throw new Error("Not signed in.");
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        window.location.href = "/dashboard";
      } else {
        setError(
          "Email not verified yet. Check your inbox and click the link.",
        );
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    try {
      const currentUser = auth.currentUser || user;
      if (!currentUser) throw new Error("Not signed in.");
      await sendEmailVerification(
        currentUser as Parameters<typeof sendEmailVerification>[0],
      );
      setSent(true);
      setCooldown(COOLDOWN_SECONDS);
    } catch {
      setError("Failed to resend. Please wait a moment and try again.");
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-swansons-cream">
      <div className="flex flex-col items-center gap-6 max-w-sm w-full">
        <Logo width={120} height={60} />

        <h1 className="font-heading text-3xl font-bold text-swansons-navy text-center">
          Check your inbox
        </h1>

        <p className="font-body text-swansons-muted text-center leading-relaxed">
          We sent a verification link to your email. Click it to activate your
          account.
        </p>

        {sent && (
          <p className="font-body text-swansons-green text-sm text-center">
            Verification email resent!
          </p>
        )}

        {error && (
          <p className="font-body text-red-500 text-sm text-center">{error}</p>
        )}

        {/* Primary — check if verified */}
        <Button
          variant="primary"
          size="lg"
          className="w-full rounded-full"
          onClick={handleCheckVerification}
          disabled={checking}
        >
          {checking ? "Checking..." : "I've Verified My Email"}
        </Button>

        {/* Secondary — resend */}
        <Button
          variant="secondary"
          size="md"
          className="w-full rounded-full"
          onClick={handleResend}
          disabled={cooldown > 0}
        >
          {cooldown > 0 ? `Resend Email (${cooldown}s)` : "Resend Email"}
        </Button>

        <button
          onClick={handleSignOut}
          className="font-body text-swansons-muted text-sm underline underline-offset-2"
        >
          Sign Out
        </button>
      </div>
    </main>
  );
}
