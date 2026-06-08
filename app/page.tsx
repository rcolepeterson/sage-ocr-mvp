"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/AuthContext";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { motion } from "motion/react";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-swansons-cream">
        <div className="animate-spin w-8 h-8 border-2 border-swansons-green border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <main
      data-lenis-prevent
      className="h-screen flex flex-col items-center justify-center px-6 overflow-hidden"
      style={{
        height: "100dvh",
        backgroundImage: "url('/images/LandingPage_BG.png')",
        backgroundSize: "cover",
        backgroundPosition: "top",
        backgroundRepeat: "no-repeat",
      }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center text-center max-w-sm w-full gap-6"
      >
        {/* Logo */}
        <motion.div variants={itemVariants}>
          <Logo width={160} height={80} />
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-swansons-navy text-4xl"
        >
          Your thumbs just turned green.
        </motion.h1>

        {/* Subtext */}
        <motion.p
          variants={itemVariants}
          className="font-body text-swansons-black text-lg leading-snug mx-4"
        >
          Sage exports our knowledge and customer service from the nursery to
          wherever your plants end up. Start gardening like an expert.
        </motion.p>

        {/* Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-3 w-full"
        >
          <Link href="/signin" className="w-full">
            <Button
              variant="primary"
              size="md"
              className="w-full rounded-full text-base"
            >
              Log In
            </Button>
          </Link>
          <Link href="/signin?mode=signup" className="w-full">
            <Button
              variant="secondary"
              size="md"
              className="w-full rounded-full text-base"
            >
              Sign Up
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
