/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/firebase/AuthContext";
import { useEffect, useState, useRef } from "react";
import {
  subscribeToAllThreads,
  subscribeToThread,
  updateThreadStatus,
  addReply,
  Thread,
} from "@/lib/firebase/threads";
import { uploadThreadPhoto } from "@/lib/firebase/storage";
import { getUser } from "@/lib/firebase/users";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import { compressImage } from "@/lib/utils/imageCompression";

function AdminInboxPage() {
  const { user, loading, role } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAllThreads(setThreads);
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchNames = async () => {
      const uniqueUserIds = [...new Set(threads.map((t) => t.userId))];
      const names: Record<string, string> = {};
      await Promise.all(
        uniqueUserIds.map(async (uid) => {
          if (!userNames[uid]) {
            const userData = await getUser(uid);
            names[uid] = userData?.displayName || userData?.email || "Unknown";
          }
        }),
      );
      setUserNames((prev) => ({ ...prev, ...names }));
    };
    if (threads.length > 0) fetchNames();
  }, [threads]);

  useEffect(() => {
    if (!selectedThreadId) return;
    const unsub = subscribeToThread(selectedThreadId, setSelectedThread);
    return () => unsub();
  }, [selectedThreadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThread?.replies]);
  console.log("[inbox] role:", role, "uid:", user?.uid);
  // ─── Filter logic ────────────────────────────────────────────────────────
  const visibleThreads = (() => {
    if (role === "staff") {
      // Staff only see threads assigned to them
      return threads.filter((t) => t.assignedTo === user?.uid);
    }
    // Admin — filter by selected staff member
    if (staffFilter === "all") return threads;
    if (staffFilter === "unassigned")
      return threads.filter((t) => !t.assignedTo);
    return threads.filter((t) => t.assignedTo === staffFilter);
  })();

  // Unique staff members who have assigned threads (for admin filter dropdown)
  const assignedStaffIds = [
    ...new Set(
      threads.filter((t) => t.assignedTo).map((t) => t.assignedTo as string),
    ),
  ];

  const handleSelectThread = (threadId: string) =>
    setSelectedThreadId(threadId);
  const handleBack = () => {
    setSelectedThreadId(null);
    setSelectedThread(null);
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
          (progress) => setUploadProgress(progress),
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

  function getStatusLabel(status: string) {
    switch (status) {
      case "new":
        return "🆕 New";
      case "assigned":
        return "👤 Assigned";
      case "waiting-on-customer":
        return "⏳ Waiting on Customer";
      case "needs-followup":
        return "🔁 Needs Follow-Up";
      case "closed":
        return "✅ Closed";
      default:
        return status;
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-swansons-green border-t-transparent rounded-full" />
      </div>
    );

  return (
    <main className="h-screen bg-swansons-cream flex flex-col overflow-hidden pb-20">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-3">
        {selectedThread && (
          <button
            onClick={handleBack}
            className="md:hidden text-swansons-navy font-body font-medium text-sm"
          >
            ← Back
          </button>
        )}
        <h1 className="font-heading font-semibold text-swansons-navy text-lg">
          {selectedThread
            ? "Thread"
            : role === "staff"
              ? "My Threads"
              : "Staff Inbox"}
        </h1>

        {/* Admin only — filter by staff */}
        {role === "admin" && !selectedThread && (
          <div className="ml-auto">
            <select
              className="input text-xs font-body py-1.5"
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
            >
              <option value="all">All Staff</option>
              <option value="unassigned">Unassigned</option>
              {assignedStaffIds.map((uid) => (
                <option key={uid} value={uid}>
                  {userNames[uid] || uid.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel — Thread List */}
        <div
          className={`w-full md:w-80 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden ${selectedThread ? "hidden md:flex" : "flex"}`}
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {visibleThreads.map((thread) => (
              <div
                key={thread.id}
                className={`rounded-xl p-3 cursor-pointer flex flex-col gap-1 ${
                  selectedThread?.id === thread.id
                    ? "bg-swansons-green-muted border-2 border-swansons-green"
                    : "bg-swansons-cream hover:bg-swansons-green-muted/50"
                }`}
                onClick={() => handleSelectThread(thread.id)}
              >
                <span className="text-xs text-swansons-muted font-body">
                  {userNames[thread.userId] || "Loading..."}
                </span>
                <span className="font-body font-medium text-sm text-swansons-navy truncate">
                  {thread.question}
                </span>
                {thread.plantName && (
                  <span className="text-xs text-swansons-green font-body mt-0.5">
                    🌱 {thread.plantName}
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full bg-white text-swansons-muted font-body self-start">
                  {getStatusLabel(thread.status)}
                </span>
              </div>
            ))}
            {visibleThreads.length === 0 && (
              <p className="font-body text-swansons-muted text-sm text-center mt-8">
                {role === "staff"
                  ? "No threads assigned to you yet."
                  : "No threads found."}
              </p>
            )}
          </div>
        </div>

        {/* Right Panel — Thread Detail */}
        <div
          className={`flex-1 flex flex-col overflow-hidden ${selectedThread ? "flex" : "hidden md:flex"}`}
        >
          {selectedThread ? (
            <>
              {/* Thread Header */}
              <div className="shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
                <p className="text-xs text-swansons-muted font-body mb-1">
                  {userNames[selectedThread.userId] || "Loading..."}
                </p>
                <p className="font-body font-medium text-swansons-navy">
                  Q: {selectedThread.question}
                </p>
                {selectedThread.plantName && (
                  <span className="text-xs text-swansons-green font-body mt-0.5 block">
                    🌱 {selectedThread.plantName}
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full bg-swansons-cream text-swansons-muted font-body">
                  {getStatusLabel(selectedThread.status)}
                </span>
              </div>

              {/* Scrollable Replies */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {selectedThread.replies?.length > 0 ? (
                  selectedThread.replies.map((r: any) => (
                    <div
                      key={r.id}
                      className={`flex flex-col max-w-sm rounded-xl p-3 ${
                        r.isStaff
                          ? "bg-swansons-green-muted self-start"
                          : "bg-white shadow self-end ml-auto"
                      }`}
                    >
                      <span className="text-xs text-swansons-muted font-body mb-1">
                        {r.isStaff
                          ? "Staff"
                          : userNames[selectedThread.userId] || "Customer"}
                      </span>
                      <span className="font-body text-sm text-swansons-text">
                        {r.message}
                      </span>
                      {r.photoURL && (
                        <a
                          href={r.photoURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2"
                        >
                          <img
                            src={r.photoURL}
                            alt="Attached photo"
                            className="rounded-xl object-cover max-h-48 border"
                          />
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="font-body text-swansons-muted text-sm">
                    No replies yet.
                  </p>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Reply Box */}
              <div className="shrink-0 px-6 py-4 border-t border-gray-200 bg-white">
                <form onSubmit={handleReply} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <PhotoPicker
                      onFile={(file) => {
                        setPhotoFile(file);
                        setPhotoPreview(URL.createObjectURL(file));
                      }}
                      disabled={submitting || uploading}
                    >
                      <button
                        type="button"
                        className="text-2xl px-2 py-1 bg-swansons-cream rounded-full hover:bg-swansons-green-muted focus:outline-none"
                        disabled={submitting || uploading}
                      >
                        📎
                      </button>
                    </PhotoPicker>
                    <textarea
                      className="flex-1 input"
                      placeholder="Type a reply..."
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      disabled={submitting || uploading}
                      required={!photoFile}
                    />
                  </div>
                  {photoPreview && (
                    <div className="flex flex-col items-center mt-2">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="rounded-xl object-cover max-h-48 border mb-2"
                      />
                      <button
                        type="button"
                        className="text-xs font-body text-red-400 underline mb-1"
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
                    <div className="text-xs font-body text-swansons-green mt-1">
                      Uploading photo... {uploadProgress.toFixed(0)}%
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-swansons-navy text-white font-body font-medium py-2 px-4 rounded-full hover:opacity-90 transition disabled:opacity-50"
                      disabled={
                        submitting || uploading || (!reply.trim() && !photoFile)
                      }
                    >
                      {submitting || uploading ? "Sending..." : "Send Reply"}
                    </button>
                    <button
                      type="button"
                      className="bg-swansons-green-muted text-swansons-green-dark font-body font-medium py-2 px-4 rounded-full hover:opacity-90 transition"
                      onClick={() => handleStatus("closed")}
                    >
                      Close Thread
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center font-body text-swansons-muted text-sm">
              Select a thread to view details.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function AdminInboxPageWrapper() {
  return (
    <ProtectedRoute requiredRole="staff">
      <AdminInboxPage />
    </ProtectedRoute>
  );
}
