"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/firebase/AuthContext";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useState } from "react";

// ─── Latest Plant placeholder ──────────────────────────────────────────────
function LatestPlantCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4">
      <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-swansons-green-muted flex items-center justify-center">
        <span className="text-3xl">🌿</span>
      </div>
      <div>
        <p className="text-xs font-body font-semibold uppercase tracking-widest text-swansons-muted mb-1">
          Latest Plant
        </p>
        <h3 className="text-lg leading-tight">Heartleaf Philodendron</h3>
        <Link
          href="/plants"
          className="text-sm text-swansons-navy underline underline-offset-2 mt-1 inline-block"
        >
          See plant profile
        </Link>
      </div>
    </div>
  );
}

// ─── Notifications placeholder ─────────────────────────────────────────────
function NotificationsCard() {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-xs font-body font-semibold uppercase tracking-widest text-swansons-muted">
          Notifications
        </span>
        <div className="flex items-center gap-3">
          <span className="bg-swansons-navy text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            3
          </span>
          <span className="text-swansons-navy text-xl leading-none">+</span>
        </div>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-swansons-muted">
          <p>Notification list coming soon.</p>
        </div>
      )}
    </div>
  );
}

// ─── Spaces / conversations placeholder ───────────────────────────────────
const PLACEHOLDER_SPACES = [
  { id: "1", name: "North Yard Bed", count: 5 },
  { id: "2", name: "Front Porch Tall Pots", count: 1 },
  { id: "3", name: "Backyard Raised Shade Bed", count: 2 },
];

function SpacesList() {
  return (
    <div className="flex flex-col gap-3">
      {PLACEHOLDER_SPACES.map((space) => (
        <div
          key={space.id}
          className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center justify-between"
        >
          <span className="text-xs font-body font-semibold uppercase tracking-widest text-swansons-text">
            {space.name}
          </span>
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {[...Array(Math.min(space.count, 3))].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-swansons-green-muted border-2 border-white flex items-center justify-center text-base"
                >
                  🌱
                </div>
              ))}
            </div>
            {space.count > 3 && (
              <span className="ml-1 bg-swansons-navy text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center">
                +{space.count - 3}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Home page ─────────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(" ")[0] ?? "there";

  return (
    <ProtectedRoute>
      <OnboardingModal />
      <main className="min-h-screen px-4 pt-6 pb-28 max-w-lg mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="text-center">
            <h1 className="text-5xl font-heading text-swansons-navy leading-none">
              sage
            </h1>
            <p className="text-xs font-body font-semibold tracking-[0.2em] uppercase text-swansons-navy mt-1">
              Swansons Nursery
            </p>
          </div>
        </div>

        {/* Welcome */}
        <div className="mb-6">
          <h2 className="text-4xl font-heading font-bold text-swansons-navy leading-tight">
            Hi, {firstName}
          </h2>
          <p className="font-body text-swansons-text mt-1">
            Hey there, green thumb. What are we tending to today?
          </p>
        </div>

        {/* Notifications */}
        <div className="mb-4">
          <NotificationsCard />
        </div>

        {/* Latest Plant */}
        <div className="mb-6">
          <LatestPlantCard />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          <Link href="/scan" className="flex-1">
            <Button
              variant="primary"
              size="lg"
              className="w-full rounded-full text-base"
            >
              Add A Plant
            </Button>
          </Link>
          <Link href="/ask" className="flex-1">
            <Button
              variant="primary"
              size="lg"
              className="w-full rounded-full text-base"
            >
              Ask An Expert
            </Button>
          </Link>
        </div>

        {/* Spaces / Conversations */}
        <SpacesList />
      </main>
    </ProtectedRoute>
  );
}
