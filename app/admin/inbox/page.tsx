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
import NotificationBanner from "@/components/ui/NotificationBanner";

function AdminInboxPage() {
  const { user, loading } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  // Photo upload state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real time listener for all threads
  useEffect(() => {
    const unsub = subscribeToAllThreads(setThreads);
    return () => unsub();
  }, []);

  // Fetch customer names for all threads
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

  // Real time listener for selected thread
  useEffect(() => {
    if (!selectedThreadId) return;
    const unsub = subscribeToThread(selectedThreadId, setSelectedThread);
    return () => unsub();
  }, [selectedThreadId]);

  // Auto scroll to bottom when replies update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThread?.replies]);

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
  };

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
      // Optionally handle error
    }
    setSubmitting(false);
    setUploading(false);
  };

  // Handle file input change
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

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

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <main className="h-screen bg-swansons-cream flex flex-col overflow-hidden pb-20">
      {/* Top Header */}
      <div className="shrink-0 px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-3">
        {/* Back button on mobile when thread is selected */}
        {selectedThread && (
          <button
            onClick={handleBack}
            className="md:hidden text-green-700 font-medium text-sm"
          >
            ← Back
          </button>
        )}
        <h1 className="text-xl font-semibold">
          {selectedThread ? "Thread" : "Staff Inbox"}
        </h1>
      </div>

      {/* Notification banner — prompts staff to enable push notifications */}
      {user && (
        <div className="shrink-0 px-4 pt-3">
          <NotificationBanner
            uid={user.uid}
            message="Get notified about new customer questions. Enable notifications"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel — Thread List
          On mobile: show only when no thread selected
          On desktop: always show */}
        <div
          className={`
        w-full md:w-80 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden
        ${selectedThread ? "hidden md:flex" : "flex"}
      `}
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {threads.map((thread) => (
              <div
                key={thread.id}
                className={`rounded p-3 cursor-pointer flex flex-col gap-1 ${
                  selectedThread?.id === thread.id
                    ? "bg-green-50 border-2 border-green-600"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
                onClick={() => handleSelectThread(thread.id)}
              >
                <span className="text-xs text-gray-400">
                  {userNames[thread.userId] || "Loading..."}
                </span>
                <span className="font-medium text-sm">{thread.question}</span>
                {thread.plantName && (
                  <span className="text-xs text-green-600 mt-0.5">
                    🌱 {thread.plantName}
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600 self-start">
                  {(() => {
                    switch (thread.status) {
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
                        return thread.status;
                    }
                  })()}
                </span>
              </div>
            ))}
            {threads.length === 0 && (
              <p className="text-gray-500 text-sm">No open threads.</p>
            )}
          </div>
        </div>

        {/* Right Panel — Thread Detail
          On mobile: show only when thread selected
          On desktop: always show */}
        <div
          className={`
        flex-1 flex flex-col overflow-hidden
        ${selectedThread ? "flex" : "hidden md:flex"}
      `}
        >
          {selectedThread ? (
            <>
              {/* Fixed Thread Header */}
              <div className="shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
                <p className="text-xs text-gray-400 mb-1">
                  {userNames[selectedThread.userId] || "Loading..."}
                </p>
                <p className="font-medium">Q: {selectedThread.question}</p>
                {selectedThread.plantName && (
                  <span className="text-xs text-green-600 mt-0.5 block">
                    🌱 {selectedThread.plantName}
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                  {(() => {
                    switch (selectedThread.status) {
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
                        return selectedThread.status;
                    }
                  })()}
                </span>
              </div>

              {/* Scrollable Replies */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {selectedThread.replies && selectedThread.replies.length > 0 ? (
                  selectedThread.replies.map((r: any) => (
                    <div
                      key={r.id}
                      className={`flex flex-col max-w-sm rounded p-3 ${
                        r.isStaff
                          ? "bg-green-50 self-start"
                          : "bg-white shadow self-end ml-auto"
                      }`}
                    >
                      <span className="text-xs text-gray-500 mb-1">
                        {r.isStaff
                          ? "Staff"
                          : userNames[selectedThread.userId] || "Customer"}
                      </span>
                      <span className="text-sm">{r.message}</span>
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
                            className="rounded object-cover max-h-48 border"
                            style={{ width: "100%", marginTop: 4 }}
                          />
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No replies yet.</p>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Fixed Bottom — Reply Box + Button */}
              <div className="shrink-0 px-6 py-4 border-t border-gray-200 bg-white">
                <form onSubmit={handleReply} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Attach photo"
                      className="text-2xl px-2 py-1 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={submitting || uploading}
                    >
                      📎
                    </button>
                    <textarea
                      className="flex-1 input min-h-15"
                      placeholder="Type a reply..."
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      disabled={submitting || uploading}
                      required={!photoFile}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handlePhotoChange}
                      disabled={submitting || uploading}
                    />
                  </div>
                  {/* Photo preview and progress */}
                  {photoPreview && (
                    <div className="flex flex-col items-center mt-2">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="rounded object-cover max-h-48 border mb-2"
                        style={{ width: "auto", maxWidth: "100%" }}
                      />
                      <button
                        type="button"
                        className="text-xs text-red-500 underline mb-1"
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
                    <div className="text-xs text-green-700 mt-1">
                      Uploading photo... {uploadProgress.toFixed(0)}%
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary flex-1"
                      disabled={
                        submitting || uploading || (!reply.trim() && !photoFile)
                      }
                    >
                      {submitting || uploading ? "Sending..." : "Send Reply"}
                    </button>
                    <button
                      type="button"
                      className="btn bg-green-200 cursor-pointer px-4"
                      onClick={() => handleStatus("closed")}
                    >
                      Close Thread
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
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
