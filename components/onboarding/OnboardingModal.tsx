"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import cn from "classnames";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/firebase/AuthContext";
import Image from "next/image";
import { markOnboardingComplete } from "@/lib/firebase/users";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";

const STEPS = [
  {
    title: "Scan your plant\ntags & labels",
    body: "Point your camera at any plant tag or label and we'll instantly identify your plant and build a personalised care plan.",
    image: "/images/ScanPlantTagorLabel.png",
  },
  {
    title: "Create your\nplant spaces",
    body: "Organise your plants by space — indoors, outdoors, or anywhere in between. Keep your whole garden in one place.",
    image: "/images/CreateYourGardenSpaces.png",
  },
  {
    title: "Get expert\nadvice & tips",
    body: "Ask our nursery experts any question about your plants and get real answers from people who know plants.",
    image: "/images/ExpertPlantAdvice.png",
  },
];

// ─── Inner component (uses useSearchParams — must be inside Suspense) ──────────
function OnboardingModalInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const preview = searchParams.get("onboarding") === "preview";

  // Always show modal for design/testing
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(0);

  // Skip onboardingCompletedAt check for design/testing

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
      className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 p-6"
      onClick={(e) => {
        if (!preview && e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden px-4">
        {/* Heading — now at the top */}
        <h2 className="text-center px-0 pt-6 pb-4 whitespace-pre-line leading-snug">
          {current.title}
        </h2>
        {/* Illustration */}
        <div className="w-full flex justify-center py-2">
          <Image
            src={current.image}
            alt={current.title}
            width={300}
            height={250}
            className="w-full h-auto max-h-48 lg:max-h-none object-contain"
            priority
          />
        </div>
        <div className="px-6 pt-5 pb-7 flex flex-col items-center">
          {/**Step dots (scrolling indicator) commented out for design */}

          {/* <div className="flex gap-2 mb-5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === step ? "bg-green-700 w-4" : "bg-gray-300 w-2",
                )}
              />
            ))}
          </div> */}

          {/* Body */}
          <p className="text-center text-black text-base leading-snug mb-7 mx-auto">
            {current.body}
          </p>
          {/* CTA button */}
          <Button
            onClick={handleNext}
            className="w-[75%] mx-auto"
            size="md"
            variant="primary"
          >
            {isLastStep ? "Get Started" : "Next"}
          </Button>
          {/* Skip */}
          <Button
            onClick={dismiss}
            className="mt-3 text-sm underline underline-offset-2"
            variant="text"
            size="sm"
            type="button"
          >
            Skip
          </Button>
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
