"use client";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { motion } from "motion/react";

export default function TermsFullPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-swansons-cream flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="font-body text-swansons-navy text-sm mb-4"
          >
            ← Back
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <Logo width={140} height={70} />
          <h1 className="font-heading text-swansons-navy text-2xl">
            Terms &amp; Conditions
          </h1>
          <p className="font-body text-swansons-muted text-sm">
            Last updated: June 2026
          </p>

          <div className="mt-6 text-left w-full space-y-6">
            <section>
              <h3 className="font-heading text-swansons-navy text-lg mb-2">
                Use of Service
              </h3>
              <p className="font-body text-swansons-text text-sm">
                [Placeholder — replace with legal content] Sage provides plant
                care information for educational purposes. Users should exercise
                judgement when applying any advice.
              </p>
              <p className="font-body text-swansons-text text-sm">
                [Placeholder — replace with legal content] Always verify
                plant-specific instructions before making critical decisions.
              </p>
            </section>

            <section>
              <h3 className="font-heading text-swansons-navy text-lg mb-2">
                Plant Care Disclaimer
              </h3>
              <p className="font-body text-swansons-text text-sm">
                [Placeholder — replace with legal content] Recommendations are
                provided "as-is" and may not suit all environments.
              </p>
              <p className="font-body text-swansons-text text-sm">
                [Placeholder — replace with legal content] Swansons is not
                liable for outcomes resulting from following guidance.
              </p>
            </section>

            <section>
              <h3 className="font-heading text-swansons-navy text-lg mb-2">
                Data Storage
              </h3>
              <p className="font-body text-swansons-text text-sm">
                [Placeholder — replace with legal content] We store
                user-submitted plant data to improve experience and provide
                services.
              </p>
              <p className="font-body text-swansons-text text-sm">
                [Placeholder — replace with legal content] Retention periods and
                safeguards are described in our privacy policy.
              </p>
            </section>

            <section>
              <h3 className="font-heading text-swansons-navy text-lg mb-2">
                Limitation of Liability
              </h3>
              <p className="font-body text-swansons-text text-sm">
                [Placeholder — replace with legal content] Except where
                prohibited by law, Swansons limits liability as set out herein.
              </p>
              <p className="font-body text-swansons-text text-sm">
                [Placeholder — replace with legal content] Consult a
                professional for critical horticultural advice.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
