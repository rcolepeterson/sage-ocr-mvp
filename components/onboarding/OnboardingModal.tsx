"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import cn from "classnames";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/firebase/AuthContext";
import Image from "next/image";
import { markOnboardingComplete } from "@/lib/firebase/users";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import type { PanInfo } from "motion/react";

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

function OnboardingModalInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const preview = searchParams.get("onboarding") === "preview";

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // Preload all step images on mount
  useEffect(() => {
    STEPS.forEach((s) => {
      const img = new window.Image();
      img.src = s.image;
    });
  }, []);

  useEffect(() => {
    async function check() {
      if (preview) {
        setVisible(true);
        return;
      }
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      setVisible(!(snap.exists() && snap.data()?.onboardingCompletedAt));
    }
    check();
  }, [user, preview]);

  const dismiss = async () => {
    setVisible(false);
    setStep(0);
    if (user && !preview) {
      await markOnboardingComplete(user.uid);
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        title: "Welcome to Sage! 🌿",
        body: "Scan your first plant tag to get started, or Ask an Expert if you have a question about a plant.",
        type: "system",
        read: false,
        createdAt: serverTimestamp(),
      });
    }
  };

  const goTo = (index: number) => {
    setDirection(index > step ? 1 : -1);
    setStep(index);
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      goTo(step + 1);
    } else {
      dismiss();
    }
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const threshold = 50;
    if (info.offset.x < -threshold && step < STEPS.length - 1) {
      goTo(step + 1);
    } else if (info.offset.x > threshold && step > 0) {
      goTo(step - 1);
    }
  };

  if (!visible) return null;

  const isLastStep = step === STEPS.length - 1;
  const current = STEPS[step];

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-6"
      onClick={(e) => {
        if (!preview && e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden px-4">
        {/* Heading */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.h2
            key={`title-${step}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="text-center px-0 pt-7 pb-4 whitespace-pre-line"
          >
            {current.title}
          </motion.h2>
        </AnimatePresence>

        {/* Swipeable illustration */}
        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`image-${step}`}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="w-full flex justify-center py-2 cursor-grab active:cursor-grabbing select-none"
            >
              <Image
                src={current.image}
                alt={current.title}
                width={300}
                height={250}
                className="w-full h-auto max-h-48 lg:max-h-none object-contain pointer-events-none"
                priority
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-6 pt-5 pb-7 flex flex-col items-center">
          {/* Step dots */}
          <div className="flex gap-2 mb-5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === step ? "bg-swansons-green w-4" : "bg-gray-300 w-2",
                )}
              />
            ))}
          </div>

          {/* Body */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.p
              key={`body-${step}`}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="text-center text-black text-base leading-snug mb-7 mx-auto"
            >
              {current.body}
            </motion.p>
          </AnimatePresence>

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
        </div>
      </div>
    </div>
  );
}

export function OnboardingModal() {
  return (
    <Suspense fallback={null}>
      <OnboardingModalInner />
    </Suspense>
  );
}
