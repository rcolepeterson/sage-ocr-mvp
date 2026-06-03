"use client";
import { useAuth, AuthContext } from "@/lib/firebase/AuthContext";
import { updateUserTermsAccepted, getUser } from "@/lib/firebase/users";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useContext, Suspense } from "react";
import { Logo } from "@/components/ui/Logo";
import { motion } from "motion/react";

const POINTS = [
  "We'll store your plants, spaces, and photos to build your garden.",
  "Care tips are friendly guidance, not a guarantee.",
  "We never sell your personal information.",
];

function TermsContent() {
  const { user } = useAuth();
  const authCtx = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const preview = searchParams.get("preview") === "true";
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (preview) return;
    if (user && user.termsAcceptedAt) {
      router.replace("/dashboard");
    }
  }, [user, router, preview]);

  const handleAgree = async () => {
    if (preview) {
      router.back();
      return;
    }
    if (!user) return;
    setSubmitting(true);
    await updateUserTermsAccepted(user.uid);
    const userDoc = await getUser(user.uid);
    if (userDoc && authCtx && typeof authCtx.setUser === "function") {
      authCtx.setUser({
        ...user,
        termsAcceptedAt: userDoc.termsAcceptedAt,
        termsVersion: userDoc.termsVersion,
      });
    }
    setSubmitting(false);
    router.replace("/dashboard");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {preview && (
        <p className="text-xs text-orange-400 font-medium uppercase tracking-wide mb-6">
          Preview mode — changes not saved
        </p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm flex flex-col gap-6"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <Logo width={140} height={70} />
        </div>

        {/* Heading + subtext */}
        <div>
          <h1 className="text-swansons-navy mb-3">
            A quick hello before we start
          </h1>
          <p className="font-body text-swansons-black leading-relaxed">
            Welcome to Sage. So we can keep track of your plants and send the
            right reminders, here's the short version of how it works.
          </p>
        </div>

        {/* Checklist card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          {POINTS.map((point, i) => (
            <div key={i} className="flex items-start gap-3">
              {/* Green checkmark */}
              <div className="w-6 h-6 rounded-full bg-swansons-green-muted flex items-center justify-center shrink-0 mt-0.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6.5l2.5 2.5 5.5-5.5"
                    stroke="#044242"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="font-body text-swansons-text text-sm leading-relaxed">
                {point}
              </p>
            </div>
          ))}
        </div>

        {/* Legal text with tappable links */}
        <p className="font-body text-swansons-black text-sm text-center leading-relaxed">
          By continuing, you agree to our{" "}
          <a
            href="#"
            className="text-swansons-navy underline underline-offset-2 font-semibold"
          >
            Terms & Conditions
          </a>{" "}
          and{" "}
          <a
            href="#"
            className="text-swansons-navy underline underline-offset-2 font-semibold"
          >
            Privacy Policy
          </a>
          .
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleAgree}
            disabled={submitting}
            className="w-full bg-swansons-green-dark text-white font-body font-semibold py-4 rounded-full text-base hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Saving..." : "I Agree & Continue"}
          </button>
          <button
            onClick={() => router.back()}
            className="w-full font-body text-swansons-muted text-sm text-center hover:text-swansons-navy transition cursor-pointer"
          >
            Go back
          </button>
        </div>
      </motion.div>
    </main>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={null}>
      <TermsContent />
    </Suspense>
  );
}
