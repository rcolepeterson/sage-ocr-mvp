/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/lib/firebase/AuthContext";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  subscribeToAllThreads,
  subscribeToThread,
  updateThreadStatus,
  addReply,
  Thread,
} from "@/lib/firebase/threads";
import { uploadThreadPhoto } from "@/lib/firebase/storage";
import { getUser } from "@/lib/firebase/users";
import { getSpaces, getPlantsInSpace } from "@/lib/firebase/spaces";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function formatDate(ts: any): string {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d
    .toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, ".");
}

function formatTime(ts: any): string {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatTimeAgo(ts: any): string {
  if (!ts) return "";
  const diffMs = Date.now() - (ts?.toMillis?.() || 0);
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}hrs ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getWaitHrs(thread: Thread): number {
  const ts = thread.lastActivityAt || thread.createdAt;
  return Math.round((Date.now() - (ts?.toMillis?.() || 0)) / 3600000);
}

function firstNameOnly(name?: string | null): string {
  if (!name) return "Customer";
  return name.trim().split(" ")[0];
}

function getStatusInfo(status: string, urgent?: boolean) {
  if (status === "waiting-on-customer")
    return {
      label: "Waiting on Customer",
      className: "bg-teal-200 text-teal-800",
      needsReply: false,
    };
  if (status === "closed")
    return {
      label: "Closed",
      className: "bg-gray-200 text-gray-500",
      needsReply: false,
    };
  if (urgent)
    return {
      label: "Urgent",
      className: "bg-red-500 text-white",
      needsReply: true,
    };
  return {
    label: "Needs Reply",
    className: "bg-orange-400 text-white",
    needsReply: true,
  };
}

/* ─── Staff Profile ─────────────────────────────────────────────────────── */
function StaffProfile({ user }: { user: any }) {
  const firstName = firstNameOnly(user?.displayName);
  const lastInitial = user?.displayName?.trim().split(" ")[1]?.[0];
  const shortName = lastInitial ? `${firstName} ${lastInitial}.` : firstName;

  return (
    <div className="flex flex-col items-center px-6 py-4">
      <div className="relative mb-2">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-swansons-green-muted flex items-center justify-center">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-swansons-green-dark font-heading font-bold text-xl">
              {user?.displayName?.[0]?.toUpperCase() || "S"}
            </span>
          )}
        </div>
        <span className="absolute bottom-0 right-0 w-4 h-4 bg-swansons-green rounded-full border-2 border-swansons-navy" />
      </div>
      <p className="font-body text-sm text-white/80">{shortName}</p>
    </div>
  );
}

/* ─── Filter categories ─────────────────────────────────────────────────── */
const FILTERS = [
  { key: "all", label: "All Open Threads" },
  { key: "needs-reply", label: "Needs Reply" },
  { key: "waiting", label: "Waiting on Customer" },
  { key: "closed", label: "Closed/Archived" },
  { key: "urgent", label: "Urgent" },
];

/* ─── Main page ─────────────────────────────────────────────────────────── */
function AdminInboxPage() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const threadIdParam = searchParams.get("threadId");
  const router = useRouter();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    threadIdParam,
  );
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState("all");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [customerContext, setCustomerContext] = useState<{
    plantCount: number;
    spaceCount: number;
  } | null>(null);
  const [staffProfiles, setStaffProfiles] = useState<Record<string, { displayName: string; photoURL?: string }>>({});
  const [plantContext, setPlantContext] = useState<{
    lightLevel?: string;
    indoor?: boolean;
    container?: boolean;
  } | null>(null);

  // Subscribe to all threads
  useEffect(() => {
    const unsub = subscribeToAllThreads(setThreads);
    return () => unsub();
  }, []);

  // Fetch customer display names
  useEffect(() => {
    if (!threads.length) return;
    const fetchNames = async () => {
      const uniqueIds = [...new Set(threads.map((t) => t.userId))];
      const names: Record<string, string> = {};
      await Promise.all(
        uniqueIds.map(async (uid) => {
          if (!userNames[uid]) {
            const data = await getUser(uid);
            names[uid] = data?.displayName || data?.email || "Customer";
          }
        }),
      );
      setUserNames((prev) => ({ ...prev, ...names }));
    };
    fetchNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads]);

  // Subscribe to selected thread
  useEffect(() => {
    if (!selectedThreadId) return;
    const unsub = subscribeToThread(selectedThreadId, setSelectedThread);
    return () => unsub();
  }, [selectedThreadId]);

  // Auto-scroll to bottom when replies update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThread?.replies]);

  // Fetch customer plant + space counts when thread opens
  useEffect(() => {
    if (!selectedThread) {
      setCustomerContext(null);
      return;
    }
    const fetchContext = async () => {
      try {
        const spaces = await getSpaces(selectedThread.userId);
        let plantCount = 0;
        for (const space of spaces) {
          const plants = await getPlantsInSpace(
            selectedThread.userId,
            space.id,
          );
          plantCount += plants.length;
        }
        setCustomerContext({ plantCount, spaceCount: spaces.length });
      } catch {
        setCustomerContext(null);
      }
    };
    fetchContext();
  }, [selectedThread?.userId]);

  // Fetch plant context details when thread opens
  useEffect(() => {
    if (!selectedThread?.plantId || !selectedThread?.userId) {
      setPlantContext(null);
      return;
    }
    const fetchPlantContext = async () => {
      try {
        const parts = selectedThread.plantId.split("_");

        // Format A: spaceId_plantId (from plant profile button)
        if (parts.length >= 2) {
          const spaceId = parts[0];
          const plantId = parts.slice(1).join("_");
          const snap = await getDoc(
            doc(
              db,
              `users/${selectedThread.userId}/spaces/${spaceId}/plants/${plantId}`,
            ),
          );
          if (snap.exists()) {
            const d = snap.data();
            setPlantContext({
              lightLevel: d.lightLevel,
              indoor: d.indoor,
              container: d.container,
            });
            return;
          }
        }

        // Format B: plain plantId (from /ask dropdown) — search all spaces
        const spaces = await getSpaces(selectedThread.userId);
        for (const space of spaces) {
          const snap = await getDoc(
            doc(
              db,
              `users/${selectedThread.userId}/spaces/${space.id}/plants/${selectedThread.plantId}`,
            ),
          );
          if (snap.exists()) {
            const d = snap.data();
            setPlantContext({
              lightLevel: d.lightLevel,
              indoor: d.indoor,
              container: d.container,
            });
            return;
          }
        }

        setPlantContext(null);
      } catch {
        setPlantContext(null);
      }
    };
    fetchPlantContext();
  }, [selectedThread?.plantId, selectedThread?.userId]);

  // Fetch staff profiles for avatar display when replies change
  useEffect(() => {
    if (!selectedThread?.replies?.length) return;
    const fetchProfiles = async () => {
      const uniqueIds: string[] = Array.from(
        new Set(
          selectedThread.replies
            .filter((r: any) => r.isStaff)
            .map((r: any) => String(r.authorId)),
        ),
      );
      const profiles: Record<string, { displayName: string; photoURL?: string }> = {};
      await Promise.all(
        uniqueIds.map(async (uid) => {
          try {
            const data = await getUser(uid);
            if (data)
              profiles[uid] = {
                displayName: data.displayName || "Swansons Expert",
                photoURL: (data as any).photoURL,
              };
          } catch {
            /* ignore */
          }
        }),
      );
      setStaffProfiles((prev) => ({ ...prev, ...profiles }));
    };
    fetchProfiles();
  }, [selectedThread?.replies]);

  // Lock body scroll while inbox is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  // ── Filter logic — both staff and admin see only THEIR assigned threads ──
  const visibleThreads = (() => {
    const base = threads.filter((t) => t.assignedTo === user?.uid);
    switch (activeFilter) {
      case "needs-reply":
        return base.filter((t) =>
          ["new", "assigned", "needs-followup"].includes(t.status),
        );
      case "waiting":
        return base.filter((t) => t.status === "waiting-on-customer");
      case "closed":
        return base.filter((t) => t.status === "closed");
      case "urgent":
        return base.filter((t) => !!t.urgent && t.status !== "closed");
      default:
        return base.filter((t) => t.status !== "closed");
    }
  })();

  const handleSelectThread = (id: string) => {
    setSelectedThreadId(id);
    router.replace(`/admin/inbox?threadId=${id}`);
  };

  const handleBack = () => {
    setSelectedThreadId(null);
    setSelectedThread(null);
    router.replace("/admin/inbox");
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!reply.trim() && !photoFile) || !user || !selectedThread) return;
    setSubmitting(true);
    setUploading(false);
    setUploadProgress(0);
    let photoURL = "";
    try {
      if (photoFile) {
        setUploading(true);
        photoURL = await uploadThreadPhoto(
          user.uid,
          selectedThread.id,
          photoFile,
          (p) => setUploadProgress(p),
        );
        setUploading(false);
      }
      await addReply(
        selectedThread.id,
        user.uid,
        reply.trim(),
        true,
        photoURL || undefined,
      );

      // Notify customer
      try {
        const customerData = await getUser(selectedThread.userId);
        await addDoc(collection(db, "notifications"), {
          userId: selectedThread.userId,
          title: "New reply from Swansons",
          body: reply.trim() || "A staff member replied to your thread.",
          type: "reply",
          read: false,
          createdAt: serverTimestamp(),
          threadId: selectedThread.id,
          ctaUrl: `/ask/${selectedThread.id}`,
          ctaLabel: "View reply →",
        });
        if (customerData?.email) {
          fetch("/api/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: customerData.email,
              subject: "You have a new reply from Swansons Nursery",
              html: `<div style="font-family:sans-serif;padding:32px"><h2 style="color:#141f62">New reply from Swansons</h2><p>${reply.trim() || "A staff member replied."}</p><a href="https://sage-ocr-mvp-one.vercel.app/ask/${selectedThread.id}" style="background:#141f62;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;display:inline-block;margin-top:20px">View reply →</a></div>`,
            }),
          }).catch(() => {});
        }
      } catch (notifyErr) {
        console.warn("[notify]", notifyErr);
      }

      setReply("");
      setPhotoFile(null);
      setPhotoPreview("");
      setUploadProgress(0);
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
    setUploading(false);
  };

  const handleStatus = async (
    status:
      | "new"
      | "assigned"
      | "waiting-on-customer"
      | "needs-followup"
      | "closed",
  ) => {
    if (!selectedThread) return;
    await updateThreadStatus(selectedThread.id, status);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-swansons-green border-t-transparent rounded-full" />
      </div>
    );

  /* ── FILTER SIDEBAR ─────────────────────────────────────────────────────── */
  const filterSidebar = (
    <div className="flex flex-col h-full">
      <div className="p-5 pb-2">
        <Logo width={80} height={40} />
      </div>
      <StaffProfile user={user} />
      <nav className="flex-1 px-3 flex flex-col gap-0.5 mt-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`text-left font-body text-sm py-2.5 px-3 rounded-lg transition-all w-full ${
              activeFilter === key
                ? "bg-white/20 text-white font-semibold"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );

  /* ── THREAD CONTEXT SIDEBAR ─────────────────────────────────────────────── */
  const threadContextSidebar = selectedThread ? (
    <div className="flex flex-col h-full overflow-y-auto" data-lenis-prevent>
      <div className="p-5 pb-2">
        <Logo width={80} height={40} />
      </div>
      <StaffProfile user={user} />

      {/* Back button */}
      <div className="px-4 pb-5">
        <button
          onClick={handleBack}
          className="w-full flex items-center justify-center gap-2 border-2 border-white/60 rounded-full py-2.5 font-body text-sm text-white hover:bg-white/10 transition"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M5 12l7-7M5 12l7 7" />
          </svg>
          Back to Threads
        </button>
      </div>

      {/* Thread Status */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs font-body uppercase tracking-widest text-white/40 mb-3">
          Thread Status
        </p>
        {(() => {
          const si = getStatusInfo(
            selectedThread.status,
            selectedThread.urgent,
          );
          return (
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-body font-semibold ${si.className}`}
            >
              {si.label}
            </span>
          );
        })()}
        <div className="mt-3 space-y-2">
          <div className="flex justify-between font-body text-sm">
            <span className="text-white/50">Wait Time:</span>
            <span className="font-bold text-white">
              {getWaitHrs(selectedThread)}hrs
            </span>
          </div>
          <div className="flex justify-between font-body text-sm">
            <span className="text-white/50">Replies:</span>
            <span className="font-bold text-white">
              {selectedThread.replies?.length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Customer */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs font-body uppercase tracking-widest text-white/40 mb-3">
          Customer
        </p>
        <div className="space-y-2">
          <div className="flex justify-between font-body text-sm">
            <span className="text-white/50">Name:</span>
            <span className="font-bold text-white">
              {firstNameOnly(userNames[selectedThread.userId])}
            </span>
          </div>
          {customerContext && (
            <>
              <div className="flex justify-between font-body text-sm">
                <span className="text-white/50">Plants:</span>
                <span className="font-bold text-white">
                  {customerContext.plantCount}
                </span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span className="text-white/50">Spaces:</span>
                <span className="font-bold text-white">
                  {customerContext.spaceCount}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Plant Context */}
      {selectedThread.plantName && (
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-xs font-body uppercase tracking-widest text-white/40 mb-3">
            Plant Context
          </p>
          <p className="font-body font-bold text-white text-sm">
            {selectedThread.plantName}
          </p>
          {plantContext ? (
            <div className="mt-2 space-y-1">
              {plantContext.lightLevel && (
                <p className="font-body text-white/70 text-xs">
                  {plantContext.lightLevel === "high"
                    ? "Full Sun"
                    : plantContext.lightLevel === "medium"
                      ? "Part Shade"
                      : "Full Shade"}
                </p>
              )}
              {plantContext.indoor !== undefined && (
                <p className="font-body text-white/70 text-xs">
                  {plantContext.indoor ? "Indoor" : "Outdoor"}
                </p>
              )}
              {plantContext.container !== undefined && (
                <p className="font-body text-white/70 text-xs">
                  {plantContext.container ? "Container" : "In-ground"}
                </p>
              )}
            </div>
          ) : (
            <p className="font-body text-white/40 text-xs mt-1">N/A</p>
          )}
        </div>
      )}

      {/* Close thread */}
      <div className="px-4 py-4 border-t border-white/10 mt-auto">
        <button
          onClick={() => handleStatus("closed")}
          className="w-full text-xs font-body text-white/40 hover:text-white underline underline-offset-2 transition text-center"
        >
          Close Thread
        </button>
      </div>
    </div>
  ) : null;

  /* ── THREAD LIST VIEW ───────────────────────────────────────────────────── */
  const threadListView = (
    <div className="flex-1 overflow-y-auto px-8 py-8" data-lenis-prevent>
      <h1
        className="font-heading font-bold text-swansons-navy mb-6"
        style={{ fontSize: "2rem" }}
      >
        My Threads
      </h1>

      {/* Column headers */}
      <div className="grid grid-cols-[140px_1fr_180px_180px] gap-4 px-5 mb-2">
        {[
          "Date / Time",
          "Customer / Thread",
          "Plant/Location",
          "Wait/Status",
        ].map((h) => (
          <span
            key={h}
            className="text-xs font-body font-bold uppercase tracking-widest text-swansons-muted"
          >
            {h}
          </span>
        ))}
      </div>

      {/* Thread cards */}
      <div className="flex flex-col gap-3">
        {visibleThreads.length === 0 && (
          <div className="text-center py-16">
            <p className="font-body text-swansons-muted text-sm">
              {activeFilter === "all"
                ? "No threads assigned to you yet. Grab some from the dashboard!"
                : "No threads in this category."}
            </p>
          </div>
        )}

        {visibleThreads.map((t) => {
          const si = getStatusInfo(t.status, t.urgent);
          const waitHrs = getWaitHrs(t);
          const customerName = userNames[t.userId] || "Customer";

          return (
            <div
              key={t.id}
              onClick={() => handleSelectThread(t.id)}
              className={`grid grid-cols-[140px_1fr_180px_180px] gap-4 items-center px-5 py-4 rounded-2xl cursor-pointer transition-opacity hover:opacity-90 ${
                si.needsReply ? "bg-swansons-navy" : "bg-white shadow-sm"
              }`}
            >
              {/* Date / Time */}
              <div>
                <p
                  className={`font-body text-sm ${si.needsReply ? "text-white/70" : "text-swansons-muted"}`}
                >
                  {formatDate(t.createdAt)}
                </p>
                <p
                  className={`font-body text-sm ${si.needsReply ? "text-white/50" : "text-swansons-muted/60"}`}
                >
                  {formatTime(t.createdAt)}
                </p>
              </div>

              {/* Customer / Thread */}
              <div className="min-w-0">
                <p
                  className={`font-body font-bold text-sm mb-1 ${si.needsReply ? "text-white" : "text-swansons-navy"}`}
                >
                  {firstNameOnly(customerName)}
                </p>
                <p
                  className={`font-body text-sm line-clamp-2 ${si.needsReply ? "text-white/70" : "text-swansons-text"}`}
                >
                  {t.question}
                </p>
              </div>

              {/* Plant / Location */}
              <div>
                {t.plantName ? (
                  <p
                    className={`font-body font-bold text-sm ${si.needsReply ? "text-white" : "text-swansons-navy"}`}
                  >
                    {t.plantName}
                  </p>
                ) : (
                  <p
                    className={`font-body text-sm ${si.needsReply ? "text-white/40" : "text-swansons-muted"}`}
                  >
                    N/A
                  </p>
                )}
              </div>

              {/* Wait / Status */}
              <div className="flex flex-col items-end gap-1.5">
                <span
                  className={`font-heading font-bold leading-none ${si.needsReply ? "text-white" : "text-swansons-navy"}`}
                  style={{ fontSize: "1.5rem" }}
                >
                  {waitHrs}hrs
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-body font-semibold ${si.className}`}
                >
                  {si.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ── THREAD DETAIL VIEW ─────────────────────────────────────────────────── */
  const threadDetailView = selectedThread ? (
    <div className="flex flex-col h-full overflow-hidden bg-swansons-cream">
      {/* Scrollable messages */}
      <div
        className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
        data-lenis-prevent
      >
        {/* Initial question bubble */}
        <div className="flex flex-col w-full items-start">
          <span className="text-xs text-swansons-muted font-body mb-1 px-1">
            {userNames[selectedThread.userId] || "Customer"}
          </span>
          <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-white shadow-sm border border-gray-100">
            <p className="font-body text-sm text-swansons-navy leading-relaxed">
              {selectedThread.question}
            </p>
          </div>
        </div>

        {/* Replies */}
        {selectedThread.replies?.length > 0 ? (
          selectedThread.replies.map((r: any) => {
            const isStaff = r.isStaff;
            const authorId = r.authorId as string;
            const staffProfile = isStaff ? staffProfiles[authorId] : null;
            const customerName = userNames[selectedThread.userId] || "Customer";
            return (
              <div
                key={r.id}
                className={`flex flex-col w-full mb-4 ${isStaff ? "items-end" : "items-start"}`}
              >
                <div className={`flex items-end gap-3 ${isStaff ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar */}
                  <div className="shrink-0 w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                    {isStaff ? (
                      staffProfile?.photoURL ? (
                        <img src={staffProfile.photoURL} alt={staffProfile.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="font-heading font-bold text-swansons-green-dark">
                          {firstNameOnly(staffProfile?.displayName || "Swansons")[0] || "S"}
                        </span>
                      )
                    ) : (
                      userNames[selectedThread.userId] ? (
                        <span className="font-heading font-bold text-swansons-navy">
                          {firstNameOnly(userNames[selectedThread.userId])[0] || "C"}
                        </span>
                      ) : (
                        <span className="font-heading font-bold text-swansons-navy">C</span>
                      )
                    )}
                  </div>

                  {/* Message bubble */}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      isStaff ? "bg-swansons-navy text-white" : "bg-white shadow-sm border border-gray-100"
                    }`}
                  >
                    <p className={`font-body text-sm leading-relaxed ${isStaff ? "text-white" : "text-swansons-navy"}`}>
                      {r.message}
                    </p>
                    {r.photoURL && (
                      <a href={r.photoURL} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                        <img src={r.photoURL} alt="Attached" className="rounded-xl max-h-48 object-cover mt-2" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Name label */}
                <p className={`font-body text-xs text-swansons-muted mt-2 ${isStaff ? "text-right" : "text-left"}`}>
                  {isStaff
                    ? `${firstNameOnly(staffProfile?.displayName)} · Swansons Expert · ${formatTimeAgo(r.createdAt)}`
                    : `${firstNameOnly(customerName)} · Customer · ${formatTimeAgo(r.createdAt)}`}
                </p>
              </div>
            );
          })
        ) : (
          <p className="font-body text-swansons-muted text-sm text-center mt-8">No replies yet.</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      <div className="shrink-0 px-6 py-4 border-t border-gray-100 bg-white">
        <form onSubmit={handleReply}>
          <div className="border border-gray-200 rounded-2xl px-4 pt-3 pb-3 flex flex-col gap-2">
            {/* Textarea — top */}
            <textarea
              className="w-full font-body text-swansons-text placeholder:text-swansons-muted text-sm resize-none focus:outline-none bg-transparent min-h-[80px] max-h-40"
              placeholder="Type your response to customer here"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleReply(e as any);
                }
              }}
              disabled={submitting || uploading}
            />

            {/* Bottom row */}
            <div className="flex items-center justify-between">
              {/* + attach button — bottom left */}
              <PhotoPicker
                onFile={(file) => {
                  setPhotoFile(file);
                  setPhotoPreview(URL.createObjectURL(file));
                }}
                disabled={submitting || uploading}
              >
                <button
                  type="button"
                  disabled={submitting || uploading}
                  className="w-9 h-9 rounded-full border-2 border-swansons-navy flex items-center justify-center text-swansons-navy hover:bg-swansons-navy hover:text-white transition shrink-0"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </PhotoPicker>

              {/* Right side — Close Thread + Send */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStatus("closed")}
                  className="font-body text-sm text-swansons-navy border-2 border-swansons-navy rounded-full px-4 py-2 hover:bg-swansons-navy hover:text-white transition whitespace-nowrap"
                >
                  Close Thread
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting || uploading || (!reply.trim() && !photoFile)
                  }
                  className="w-10 h-10 rounded-full bg-swansons-navy flex items-center justify-center text-white disabled:opacity-40 hover:opacity-90 transition shrink-0"
                >
                  {submitting || uploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 19V5M5 12l7-7 7 7"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Photo preview */}
          {photoPreview && (
            <div className="mt-3 flex flex-col items-center">
              <img
                src={photoPreview}
                alt="Preview"
                className="rounded-xl object-cover max-h-48 border mb-2"
              />
              <button
                type="button"
                className="text-xs font-body text-red-400 underline"
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview("");
                }}
              >
                Remove photo
              </button>
            </div>
          )}

          {uploading && (
            <p className="text-xs font-body text-swansons-green mt-2">
              Uploading... {uploadProgress.toFixed(0)}%
            </p>
          )}
        </form>
      </div>
    </div>
  ) : null;

  /* ── RENDER ─────────────────────────────────────────────────────────────── */
  return (
    <main className="h-screen flex overflow-hidden">
      <aside className="w-60 bg-swansons-navy shrink-0 flex flex-col overflow-hidden">
        {selectedThread ? threadContextSidebar : filterSidebar}
      </aside>
      <div className="flex-1 bg-swansons-cream flex flex-col overflow-hidden">
        {selectedThread ? threadDetailView : threadListView}
      </div>
    </main>
  );
}

export default function AdminInboxPageWrapper() {
  return (
    <ProtectedRoute requiredRole="staff">
      <Suspense>
        <AdminInboxPage />
      </Suspense>
    </ProtectedRoute>
  );
}
