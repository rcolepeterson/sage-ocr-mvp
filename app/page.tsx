/* eslint-disable @next/next/no-img-element */
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/firebase/AuthContext";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useSpaces } from "@/lib/hooks/useSpaces";
import { useState } from "react";

// ─── Latest Plant placeholder ──────────────────────────────────────────────
function LatestPlantCard() {
  const { latestPlant } = useSpaces();

  if (!latestPlant) return null;

  const { plant, spaceId, plantId } = latestPlant;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4">
      <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-swansons-green-muted flex items-center justify-center border-[4px] border-swansons-green">
        {plant.photo ? (
          <img
            src={plant.photo}
            alt={plant.commonName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-3xl">🌿</span>
        )}
      </div>
      <div>
        <p className="text-xs font-body font-bold uppercase tracking-widest text-swansons-black mb-1">
          Latest Plant
        </p>
        <h3 className="text-lg leading-tight">{plant.commonName}</h3>
        <Link
          href={`/plant/${spaceId}/${plantId}`}
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
    <div className="relative bg-white rounded-2xl shadow-sm overflow-visible">
      {/* Badge — half on/half off top right */}
      <span className=" pb-0.5  absolute -top-2 -right-2 bg-swansons-navy text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center z-10">
        3
      </span>

      <button
        className="w-full flex items-center justify-between px-5 py-4"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-xs font-body font-bold uppercase tracking-widest text-swansons-black">
          Notifications
        </span>
        <span className="text-swansons-navy text-3xl leading-none">+</span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-swansons-muted">
          <p>Notification list coming soon.</p>
        </div>
      )}
    </div>
  );
}

// ─── Spaces list — real data from Firestore ────────────────────────────────
function SpacesList() {
  const { spaces, plantCounts, plantPhotos, loading } = useSpaces();

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-sm px-5 py-4 h-16 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (spaces.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm px-5 py-6 text-center">
        <p className="font-body text-swansons-muted text-sm">
          No spaces yet — scan a plant tag to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {spaces.map((space) => {
        const count = plantCounts[space.id] ?? 0;
        const photos = plantPhotos[space.id] ?? [];

        return (
          <Link href="/spaces" key={space.id}>
            <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-body font-semibold uppercase tracking-widest text-swansons-text">
                  {space.name}
                </span>
                <p className="text-xs font-body text-swansons-muted mt-0.5">
                  {count} {count === 1 ? "plant" : "plants"}
                </p>
              </div>

              <div className="flex items-center">
                <div className="flex -space-x-3">
                  {photos.map((photo, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full overflow-hidden border-2 border-white bg-swansons-green-muted shrink-0"
                    >
                      {photo ? (
                        <img
                          src={photo}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm">
                          🌱
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Placeholder circles if fewer than 3 photos but count > 0 */}
                  {count > 0 &&
                    photos.length < Math.min(count, 3) &&
                    [...Array(Math.min(count, 3) - photos.length)].map(
                      (_, i) => (
                        <div
                          key={`placeholder-${i}`}
                          className="w-10 h-10 rounded-full border-2 border-white bg-swansons-green-muted flex items-center justify-center text-sm shrink-0"
                        >
                          🌱
                        </div>
                      ),
                    )}
                  {count > 3 && (
                    <div className="w-10 h-10 rounded-full  bg-swansons-navy text-white text-sm flex items-center justify-center shrink-0">
                      <span
                        style={{
                          marginRight: 4,
                          fontFamily: "var(--font-poppins)",
                          fontWeight: 300,
                        }}
                      >
                        +{count - 3}
                      </span>
                    </div>
                  )}
                </div>
                {count === 0 && (
                  <span className="text-xs font-body text-swansons-muted">
                    No plants yet
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
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
          <Logo />
        </div>

        {/* Welcome */}
        <div className="mb-6">
          <h2 className="text-4xl font-heading  text-swansons-navy leading-tight">
            Hi, {firstName}
          </h2>
          <p className="font-body text-swansons-black mt-1">
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
              size="md"
              className="w-full rounded-full text-base"
            >
              Add A Plant
            </Button>
          </Link>
          <Link href="/ask" className="flex-1">
            <Button
              variant="primary"
              size="md"
              className="w-full rounded-full text-base"
            >
              Ask An Expert
            </Button>
          </Link>
        </div>

        {/* Spaces */}
        <SpacesList />
      </main>
    </ProtectedRoute>
  );
}
