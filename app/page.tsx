"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/firebase/AuthContext";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useState, useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";

// ─── Slide-out hamburger menu ──────────────────────────────────────────────
function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <>
      {/* Hamburger button */}
      <button
        className="absolute right-0 flex flex-col gap-1.5 p-1 z-50"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {/* Animate bars into X */}
        <span
          className={`block w-6 h-0.5 bg-swansons-navy rounded transition-all duration-300 origin-center ${open ? "rotate-45 translate-y-2" : ""}`}
        />
        <span
          className={`block w-6 h-0.5 bg-swansons-navy rounded transition-all duration-300 ${open ? "opacity-0 scale-x-0" : ""}`}
        />
        <span
          className={`block h-0.5 bg-swansons-navy rounded transition-all duration-300 origin-center ${open ? "w-6 -rotate-45 -translate-y-2" : "w-4"}`}
        />
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />

      {/* Slide-out panel */}
      <div
        ref={menuRef}
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-6 pt-8 pb-6 border-b border-gray-100">
          <span className="font-heading text-2xl text-swansons-navy">sage</span>
          <button
            onClick={() => setOpen(false)}
            className="p-1 text-swansons-muted hover:text-swansons-navy transition-colors"
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M4 4l12 12M16 4L4 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col px-6 py-6 gap-1 flex-1">
          {[
            { label: "My Plants", href: "/plants" },
            { label: "Scan a Plant", href: "/scan" },
            { label: "Ask an Expert", href: "/ask" },
            { label: "Account", href: "#" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="font-body text-base text-swansons-navy py-3 border-b border-gray-100 hover:text-swansons-green transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-6 pb-10">
          <button
            onClick={() => signOut(auth)}
            className="w-full text-sm font-body text-swansons-muted underline underline-offset-2 hover:text-swansons-navy transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

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
        <div className="flex items-center justify-center mb-8 relative">
          <div className="text-center">
            <h1 className="text-5xl font-heading text-swansons-navy leading-none">
              sage
            </h1>
            <p className="text-xs font-body font-semibold tracking-[0.2em] uppercase text-swansons-navy mt-1">
              Swansons Nursery
            </p>
          </div>
          <HamburgerMenu />
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
