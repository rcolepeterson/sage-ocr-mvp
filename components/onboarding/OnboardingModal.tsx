"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import cn from "classnames";
import { useAuth } from "@/lib/firebase/AuthContext";
import { markOnboardingComplete } from "@/lib/firebase/users";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";

const STEPS = [
  {
    title: "Scan your plant\ntags & labels",
    body: "Point your camera at any plant tag or label and we'll instantly identify your plant and build a personalised care plan.",
  },
  {
    title: "Create your\nplant spaces",
    body: "Organise your plants by space — indoors, outdoors, or anywhere in between. Keep your whole garden in one place.",
  },
  {
    title: "Get expert\nadvice & tips",
    body: "Ask our nursery experts any question about your plants and get real answers from people who know plants.",
  },
];

// ─── Inner component (uses useSearchParams — must be inside Suspense) ──────────
function OnboardingModalInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const preview = searchParams.get("onboarding") === "preview";

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;

    if (preview) {
      setVisible(true);
      return;
    }

    const check = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists() && !snap.data().onboardingCompletedAt) {
        setVisible(true);
      }
    };

    check();
  }, [user, preview]);

  const dismiss = async () => {
    setVisible(false);
    setStep(0);
    if (user && !preview) {
      await markOnboardingComplete(user.uid);
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  const isLastStep = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      onClick={(e) => {
        if (!preview && e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Illustration area — swap in real assets when ready */}
        <div className="bg-gray-100 h-56 flex items-center justify-center">
          <span className="text-gray-400 text-sm italic">
            Illustration placeholder — step {step + 1}
          </span>
        </div>
        <div className="px-6 pt-5 pb-7 flex flex-col items-center">
          {/* Step dots */}
          <div className="flex gap-2 mb-5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === step ? "bg-green-700 w-4" : "bg-gray-300 w-2",
                )}
              />
            ))}
          </div>
          {/* Heading */}
          <h2 className="text-2xl font-semibold text-center text-green-600 mb-3 whitespace-pre-line leading-snug">
            {current.title}
          </h2>
          {/* Body */}
          <p className="text-center text-gray-500 text-sm leading-relaxed mb-7">
            {current.body}
          </p>
          {/* CTA button */}
          <button
            onClick={handleNext}
            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-medium py-3 rounded-xl transition-colors duration-200"
          >
            {isLastStep ? "Get Started" : "Next"}
          </button>
          {/* Skip */}
          <button
            onClick={dismiss}
            className="mt-3 text-sm text-gray-400 underline underline-offset-2 hover:text-gray-600 transition-colors"
          >
            Skip
          </button>
          {/* Preview badge — visible to designer so they know they're in preview mode */}
          {preview && (
            <span className="mt-4 text-xs text-orange-400 font-medium tracking-wide uppercase">
              Preview mode — changes not saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Public export — Suspense boundary is self-contained ─────────────────────
export function OnboardingModal() {
  return (
    <Suspense fallback={null}>
      <OnboardingModalInner />
    </Suspense>
  );
}
