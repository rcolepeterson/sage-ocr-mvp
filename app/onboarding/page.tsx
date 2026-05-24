"use client";
import { useAuth, AuthContext } from "@/lib/firebase/AuthContext";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { updateUserDisplayName } from "@/lib/firebase/users";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useContext, useEffect, Suspense } from "react";

function OnboardingForm() {
  const { user } = useAuth();
  const authCtx = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const preview = searchParams.get("onboarding") === "preview";
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!preview && user && user.displayName) {
      router.replace("/dashboard");
    }
  }, [user, router, preview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    if (!preview && user) {
      await updateUserDisplayName(user.uid, name.trim());
      if (authCtx && typeof authCtx.setUser === "function") {
        authCtx.setUser({ ...user, displayName: name.trim() });
      }
      setSubmitting(false);
      router.replace("/dashboard");
    } else {
      setTimeout(() => setSubmitting(false), 800);
    }
  };

  return (
    <main className="min-h-screen px-4 pt-6">
      {/* Logo */}
      <div className="flex justify-center mb-16">
        <Logo width={160} height={80} />
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto">
        <h1 className="text-swansons-navy text-center mb-3">Welcome</h1>
        <p className="font-body text-swansons-text text-center mb-8">
          Let&apos;s get started. What&apos;s your name?
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-6"
        >
          <input
            className="w-full bg-white border-0 border-b-2 border-swansons-navy/20 font-body text-lg px-4 py-3 focus:outline-none focus:border-swansons-navy text-swansons-text placeholder:text-swansons-muted rounded-sm"
            placeholder="First Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            maxLength={40}
            required
            autoFocus
          />

          <Button
            type="submit"
            className=""
            disabled={submitting || !name.trim()}
            size="md"
            variant="primary"
          >
            {submitting
              ? preview
                ? "Simulating..."
                : "Saving..."
              : "Continue"}
          </Button>

          <Button
            type="button"
            variant="text"
            size="sm"
            onClick={() => router.replace("/dashboard")}
          >
            Skip
          </Button>

          {preview && (
            <span className="text-xs text-orange-400 font-medium tracking-wide uppercase">
              Preview mode — changes not saved
            </span>
          )}
        </form>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  );
}
