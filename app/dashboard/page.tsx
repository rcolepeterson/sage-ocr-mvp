/* eslint-disable @next/next/no-img-element */
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/firebase/AuthContext";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useSpaces } from "@/lib/hooks/useSpaces";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import type { PanInfo } from "motion/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import {
  onNotificationsSnapshot,
  markNotificationAsRead,
  getUnreadCount,
  type Notification,
} from "@/lib/firebase/notifications";

// ─── Latest Plant placeholder ──────────────────────────────────────────────
function LatestPlantCard() {
  const { latestPlant } = useSpaces();

  if (!latestPlant) return null;

  const { plant, spaceId, plantId } = latestPlant;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4">
      <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-swansons-green-muted flex items-center justify-center border-4 border-swansons-green">
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

// ─── Notifications card ────────────────────────────────────────────────────
function NotificationsCard() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(
    searchParams.get("notifications") === "open",
  );

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Real-time listener — auto-expires 30 days server-side in the query
  useEffect(() => {
    if (!user) return;
    const unsub = onNotificationsSnapshot(user.uid, (notifs) => {
      setNotifications(notifs);
    });
    return () => unsub();
  }, [user]);

  // Mark as read when a slide becomes active
  useEffect(() => {
    if (!open || notifications.length === 0) return;
    const notif = notifications[currentIndex];
    if (notif && !notif.read) {
      markNotificationAsRead(notif.id).catch(console.error);
    }
  }, [currentIndex, open, notifications]);

  const unreadCount = getUnreadCount(notifications);

  const goTo = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, notifications.length - 1)));
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const threshold = 50;
    if (info.offset.x < -threshold && currentIndex < notifications.length - 1) {
      goTo(currentIndex + 1);
    } else if (info.offset.x > threshold && currentIndex > 0) {
      goTo(currentIndex - 1);
    }
  };

  return (
    <div className="relative bg-white rounded-2xl shadow-sm overflow-visible">
      {/* Unread badge — hidden when count is 0 */}
      {unreadCount > 0 && (
        <span
          className="absolute -top-3 -right-3 bg-swansons-navy text-white text-lg rounded-full w-10 h-10 flex items-center justify-center z-10 pb-0.5"
          style={{ fontFamily: "var(--font-poppins)", fontWeight: 300 }}
        >
          {unreadCount}
        </span>
      )}

      {/* Header row — always visible */}
      <button
        className="w-full flex items-center justify-between px-5 py-4"
        onClick={() => {
          if (!open) setCurrentIndex(0);
          setOpen((v) => !v);
        }}
      >
        <span className="text-xs font-body font-bold uppercase tracking-widest text-swansons-black">
          Notifications
        </span>
        <span className="text-swansons-navy text-6xl font-light leading-none">
          {open ? "×" : "+"}
        </span>
      </button>

      {/* Expanded panel */}
      {open && (
        <div className="px-5 pb-5" data-lenis-prevent>
          {notifications.length === 0 ? (
            /* Empty state */
            <p className="font-body text-swansons-muted text-sm text-center py-4">
              You&apos;re all caught up! 🌿
            </p>
          ) : (
            <>
              {/* Swipeable slide */}
              <div className="overflow-hidden">
                <motion.div
                  key={currentIndex}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="cursor-grab active:cursor-grabbing select-none"
                >
                  <h3 className="font-heading font-semibold text-swansons-navy text-lg leading-tight mb-2">
                    {notifications[currentIndex].title}
                  </h3>
                  <p className="font-body text-swansons-black text-sm leading-relaxed">
                    {notifications[currentIndex].body}
                  </p>
                  {notifications[currentIndex].ctaUrl &&
                    (notifications[currentIndex].ctaUrl!.startsWith("/") ? (
                      <Link
                        href={notifications[currentIndex].ctaUrl!}
                        className="font-body text-sm text-swansons-navy underline underline-offset-2 mt-3 inline-block"
                      >
                        {notifications[currentIndex].ctaLabel || "Learn more"}
                      </Link>
                    ) : (
                      <a
                        href={notifications[currentIndex].ctaUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-body text-sm text-swansons-navy underline underline-offset-2 mt-3 inline-block"
                      >
                        {notifications[currentIndex].ctaLabel || "Learn more"}
                      </a>
                    ))}
                </motion.div>
              </div>

              {/* Pagination dots — only shown when more than one notification */}
              {notifications.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {notifications.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      className={`h-2 rounded-full transition-all ${
                        i === currentIndex
                          ? "bg-swansons-navy w-4"
                          : "bg-swansons-muted/40 w-2"
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
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
                          <img
                            src="/images/PlantProfileIcon.png"
                            alt="Plant"
                            className="w-full h-full object-contain p-1"
                          />
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
                          <img
                            src="/images/PlantProfileIcon.png"
                            alt="Plant"
                            className="w-full h-full object-contain p-1"
                          />
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

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ─── Home page ─────────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(" ")[0] ?? "there";

  return (
    <ProtectedRoute>
      <OnboardingModal />
      <main className="min-h-screen px-4 pt-6 pb-28 max-w-lg mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col"
        >
          {/* Logo */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center mb-8"
          >
            <Logo />
          </motion.div>

          {/* Welcome */}
          <motion.div variants={itemVariants} className="mb-6">
            <h2 className="text-4xl font-heading text-swansons-navy leading-tight">
              Hi, {firstName}
            </h2>
            <p className="font-body text-swansons-black mt-1">
              Hey there, green thumb. What are we tending to today?
            </p>
          </motion.div>

          {/* Notifications */}
          <motion.div variants={itemVariants} className="mb-4">
            <Suspense fallback={null}>
              <NotificationsCard />
            </Suspense>
          </motion.div>

          {/* Latest Plant */}
          <motion.div variants={itemVariants} className="mb-6">
            <LatestPlantCard />
          </motion.div>

          {/* Action Buttons */}
          {/* Action Buttons */}
          <motion.div variants={itemVariants} className="flex gap-3 mb-8">
            <motion.div
              className="flex-1"
              style={{ borderRadius: "9999px" }}
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(20,31,98,0.5)",
                  "0 0 0 10px rgba(20,31,98,0)",
                  "0 0 0 0 rgba(20,31,98,0)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            >
              <Link href="/scan" className="block w-full">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full rounded-full text-base"
                >
                  Add A Plant
                </Button>
              </Link>
            </motion.div>
            <Link href="/ask" className="flex-1">
              <Button
                variant="primary"
                size="md"
                className="w-full rounded-full text-base"
              >
                Ask An Expert
              </Button>
            </Link>
          </motion.div>

          {/* Spaces */}
          <motion.div variants={itemVariants}>
            <SpacesList />
          </motion.div>
        </motion.div>
      </main>
    </ProtectedRoute>
  );
}
