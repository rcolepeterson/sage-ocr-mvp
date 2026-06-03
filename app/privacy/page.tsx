"use client";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { motion } from "motion/react";

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="font-body text-swansons-muted text-sm">
            Last updated: June 2026
          </p>

          <div className="mt-6 text-left w-full space-y-6">
            <section>
              <h3 className="font-heading text-swansons-navy text-lg mb-2">
                What We Collect
              </h3>
              <p className="font-body text-swansons-text text-sm">
                [Placeholder — replace with legal content] We collect
                information you provide and metadata from your device to operate
                the service.
              </p>
            </section>

            <section>
              <h3 className="font-heading text-swansons-navy text-lg mb-2">
                How We Use It
              </h3>
              <p className="font-body text-swansons-text text-sm">
                [Placeholder — replace with legal content] Data is used to
                personalize care tips and improve product features.
              </p>
            </section>

            <section>
              <h3 className="font-heading text-swansons-navy text-lg mb-2">
                Data Storage
              </h3>
              <p className="font-body text-swansons-text text-sm">
                [Placeholder — replace with legal content] We store data
                securely and retain it as necessary to provide services.
              </p>
            </section>

            <section>
              <h3 className="font-heading text-swansons-navy text-lg mb-2">
                Your Rights
              </h3>
              <p className="font-body text-swansons-text text-sm">
                [Placeholder — replace with legal content] You can access,
                correct, or request deletion of your personal data.
              </p>
            </section>

            <section>
              <h3 className="font-heading text-swansons-navy text-lg mb-2">
                Contact Us
              </h3>
              <p className="font-body text-swansons-text text-sm">
                [Placeholder — replace with legal content] For privacy
                inquiries, contact privacy@swansons.example or use the support
                channel.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
