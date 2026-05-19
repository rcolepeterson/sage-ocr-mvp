/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Suspense } from "react";
import type { Space, Plant } from "@/lib/firebase/spaces";
import { getSpaces, getPlantsInSpace } from "@/lib/firebase/spaces";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/firebase/AuthContext";
import { useState, useEffect } from "react";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import {
  createThread,
  subscribeToThreads,
  addReply,
} from "@/lib/firebase/threads";
import { uploadThreadPhoto } from "@/lib/firebase/storage";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import NotificationBanner from "@/components/ui/NotificationBanner";
import { Logo } from "@/components/ui/Logo";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatDate(timestamp: any): string {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date
    .toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, ".");
}

function getStatusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case "waiting-on-customer":
      return { label: "Replied", className: "bg-swansons-green text-white" };
    case "needs-followup":
    case "new":
    case "assigned":
    case "pending":
      return { label: "Sent", className: "bg-orange-400 text-white" };
    case "closed":
    case "answered":
      return { label: "Closed", className: "bg-gray-200 text-gray-500" };
    default:
      return { label: status, className: "bg-gray-200 text-gray-500" };
  }
}

/* ─── Inner page (uses useSearchParams) ─────────────────────────────────── */
function AskPageInner() {
  const { user, loading } = useAuth();
  const [question, setQuestion] = useState("");
  const [threads, setThreads] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState("");
  const [selectedPlantName, setSelectedPlantName] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  const searchParams = useSearchParams();

  const urlPlantId = searchParams.get("plantId") || "";
  const urlPlantName = searchParams.get("plantName") || "";

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToThreads(user.uid, setThreads);
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || urlPlantId) return;
    getSpaces(user.uid).then(setSpaces);
  }, [user, urlPlantId]);

  const handleSpaceChange = (spaceId: string) => {
    setSelectedSpaceId(spaceId);
    setPlants([]);
    setSelectedPlantId("");
    setSelectedPlantName("");
    if (spaceId && user) {
      getPlantsInSpace(user.uid, spaceId).then(setPlants);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !user) return;
    setSubmitting(true);
    const threadPlantId = urlPlantId || selectedPlantId;
    const threadPlantName = urlPlantName || selectedPlantName;
    const threadId = await createThread(
      threadPlantId,
      user.uid,
      question.trim(),
      threadPlantName,
    );
    if (photoFile) {
      setUploading(true);
      const photoURL = await uploadThreadPhoto(
        user.uid,
        threadId,
        photoFile,
        () => {},
      );
      await addReply(threadId, user.uid, question.trim(), false, photoURL);
      setUploading(false);
    }
    setQuestion("");
    setPhotoFile(null);
    setPhotoPreview("");
    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-swansons-green border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen flex flex-col">
        {/* ── Top section ── */}
        <div className="px-4 pt-4 pb-6">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo width={100} height={50} />
          </div>

          {/* Heading */}
          <h1 className="text-swansons-navy text-center mb-1">Ask an expert</h1>
          <p className="font-body text-swansons-muted text-center text-sm mb-5">
            Choose a space & plant (optional)
          </p>

          {/* Plant context banner */}
          {urlPlantName ? (
            <div className="bg-swansons-green-muted border border-swansons-green rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
              <span className="text-xl">🌱</span>
              <div>
                <p className="font-body text-xs text-swansons-green font-semibold">
                  Asking about:
                </p>
                <p className="font-body text-sm text-swansons-navy font-bold">
                  {urlPlantName}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Space dropdown */}
              <div className="relative mb-3">
                <select
                  className="w-full border-2 border-swansons-navy text-swansons-navy font-body py-3 px-5 rounded-full bg-transparent appearance-none"
                  value={selectedSpaceId}
                  onChange={(e) => handleSpaceChange(e.target.value)}
                >
                  <option value="">Select a space</option>
                  {spaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))}
                </select>
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-swansons-navy pointer-events-none">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>

              {/* Plant dropdown */}
              <div className="relative mb-4">
                <select
                  className="w-full border-2 border-swansons-navy text-swansons-navy font-body py-3 px-5 rounded-full bg-transparent appearance-none disabled:opacity-40"
                  value={selectedPlantId}
                  disabled={!selectedSpaceId}
                  onChange={(e) => {
                    const plant = plants.find((p) => p.id === e.target.value);
                    setSelectedPlantId(e.target.value);
                    setSelectedPlantName(plant ? plant.commonName : "");
                  }}
                >
                  <option value="">Select a plant</option>
                  {plants.map((plant) => (
                    <option key={plant.id} value={plant.id}>
                      {plant.commonName}
                    </option>
                  ))}
                </select>
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-swansons-navy pointer-events-none">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </>
          )}

          {/* Input area */}
          <form onSubmit={handleSubmit}>
            <div className="bg-white p-4 shadow-sm rounded-2xl">
              <textarea
                className="w-full font-body text-swansons-text placeholder:text-swansons-muted text-base resize-none focus:outline-none min-h-20 bg-transparent"
                placeholder={
                  urlPlantName
                    ? `What would you like to know about your ${urlPlantName}?`
                    : "Chat gardening"
                }
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={submitting || uploading}
              />

              {/* Photo preview */}
              {photoPreview && (
                <div className="mt-3">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="rounded-xl max-h-32 object-cover"
                  />
                  <button
                    type="button"
                    className="text-xs font-body text-red-400 mt-1 block"
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
                  Uploading photo...
                </p>
              )}

              <div className="flex items-center justify-between mt-2">
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
                    className="w-9 h-9 rounded-full border-2 border-swansons-navy flex items-center justify-center text-swansons-navy hover:bg-swansons-navy hover:text-white transition cursor-pointer"
                  >
                    <span className="text-4xl leading-none">+</span>
                  </button>
                </PhotoPicker>
                <button
                  type="submit"
                  disabled={submitting || uploading || !question.trim()}
                  className="w-9 h-9 rounded-full bg-swansons-navy flex items-center justify-center text-white disabled:opacity-40 hover:opacity-90 transition cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 19V5M5 12l7-7 7 7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </form>

          {/* Notification banner */}
          {user && (
            <div className="mt-4">
              <NotificationBanner
                uid={user.uid}
                message="Want to know when an expert replies? Enable notifications"
                show={submitted}
              />
            </div>
          )}
        </div>

        {/* ── Thread list — dark navy section ── */}
        <div className="flex-1 bg-swansons-navy px-4 pt-6 pb-12">
          {threads.length === 0 ? (
            <p className="font-body text-white/50 text-sm text-center mt-8">
              No threads yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {threads.map((thread) => {
                const badge = getStatusBadge(thread.status);
                return (
                  <Link key={thread.id} href={`/ask/${thread.id}`}>
                    <div className="bg-white hover:bg-gray-50 transition rounded-2xl px-4 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-body text-xs text-swansons-muted">
                          {formatDate(thread.createdAt)}
                        </span>
                        <span
                          className={`font-body text-xs px-3 py-1 rounded-full font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="font-body text-swansons-navy text-sm truncate">
                        {thread.question}
                      </p>
                      {thread.plantName && (
                        <p className="font-body text-swansons-muted text-xs mt-1 truncate">
                          🌱 {thread.plantName}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
              <button className="font-body text-white/50 text-sm text-center mt-2 underline underline-offset-2 cursor-pointer">
                Load More
              </button>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}

/* ─── Export with Suspense boundary ─────────────────────────────────────── */
export default function AskPage() {
  return (
    <Suspense fallback={null}>
      <AskPageInner />
    </Suspense>
  );
}
