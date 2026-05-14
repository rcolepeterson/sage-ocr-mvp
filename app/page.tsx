"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";

export default function Home() {
  return (
    <ProtectedRoute>
      <OnboardingModal />
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="card p-8 w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-5xl mb-3 block">🌿</span>
            <h1 className="text-2xl mb-1">Sage MVP</h1>
            <p className="text-swansons-muted">Choose a tool:</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link href="/scan">
              <Button variant="primary" className="w-full">
                Scan Plant Tag (OCR)
              </Button>
            </Link>

            <Link href="/ask" className="btn-primary w-full">
              Ask an Expert
            </Link>

            {/* Placeholder for future */}
            <Button disabled className="w-full">
              Dashboard (coming soon)
            </Button>
          </div>

          {/* Temporary Sign Out Button for testing */}
          <div className="mt-6 text-center">
            <button
              onClick={() => signOut(auth)}
              className="text-sm text-swansons-muted underline"
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
