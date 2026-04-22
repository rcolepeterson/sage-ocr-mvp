/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/firebase/AuthContext";
import { useEffect, useState, useRef } from "react";
import { subscribeToThread, addReply } from "@/lib/firebase/threads";
import { uploadThreadPhoto } from "@/lib/firebase/storage";
import { useParams } from "next/navigation";

const getCustomerStatus = (status: string) => {
  switch (status) {
    case "new":
    case "assigned":
    case "needs-followup":
      return "⏳ Sent";
    case "waiting-on-customer":
      return "💬 Replied";
    case "closed":
      return "✅ Closed";
    default:
      return "⏳ Waiting for expert";
  }
};

export default function ThreadDetailPage() {
  const { user, loading } = useAuth();
  const { threadId } = useParams() as { threadId: string };
  const [thread, setThread] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Photo upload state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Real time listener for thread + replies
  useEffect(() => {
    if (!threadId) return;
    const unsub = subscribeToThread(threadId, setThread);
    return () => unsub();
  }, [threadId]);

  // Auto scroll to bottom when replies update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.replies]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!reply.trim() && !photoFile) || !user) return;
    setSubmitting(true);
    setUploading(false);
    setUploadProgress(0);
    let photoURL = "";
    try {
      if (photoFile) {
        setUploading(true);
        photoURL = await uploadThreadPhoto(
          user.uid,
          threadId,
          photoFile,
          (progress) => setUploadProgress(progress),
        );
        setUploading(false);
      }
      await addReply(
        threadId,
        user.uid,
        reply.trim(),
        false,
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

  if (loading || !thread)
    return <p className="text-center mt-10">Loading...</p>;

  return (
    <ProtectedRoute>
      <main className="h-[calc(100vh-4rem)] flex flex-col bg-swansons-cream overflow-hidden">
        <div className="flex flex-col h-full w-full max-w-5xl mx-auto bg-white shadow-sm">
          {/* Fixed Header */}
          <div className="shrink-0 px-4 py-4 border-b border-gray-200 bg-white">
            <p className="font-medium text-sm">{thread.question}</p>
            <span
              className={`text-xs p-2 rounded mt-1 inline-block ${
                thread.status === "closed"
                  ? "bg-green-100 text-green-700"
                  : thread.status === "waiting-on-customer"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {getCustomerStatus(thread.status)}
            </span>
          </div>

          {/* Scrollable Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 flex flex-col">
            {thread.replies && thread.replies.length > 0 ? (
              thread.replies.map((r: any) => (
                <div
                  key={r.id}
                  className={`flex flex-col max-w-xs ${
                    r.isStaff ? "self-start" : "self-end ml-auto"
                  }`}
                >
                  <span className="text-xs text-gray-400 mb-1 px-1">
                    {r.isStaff ? "Swansons Expert" : "You"}
                  </span>
                  <div
                    className={`rounded-2xl px-4 py-2 text-sm ${
                      r.isStaff
                        ? "bg-gray-100 text-gray-800"
                        : "bg-green-700 text-white"
                    }`}
                  >
                    {r.message}
                  </div>
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
              <p className="text-center text-gray-400 text-sm mt-8">
                No replies yet. A Swansons expert will respond soon. 🌿
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Fixed Bottom Input */}
          <div className="shrink-0 px-4 py-4 border-t border-gray-200 bg-white">
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
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-600 min-h-15"
                  placeholder="Send a message..."
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
              <button
                type="submit"
                className="w-full rounded-full bg-green-700 text-white py-2 text-sm font-medium hover:bg-green-800 transition disabled:opacity-50"
                disabled={
                  submitting || uploading || (!reply.trim() && !photoFile)
                }
              >
                {submitting || uploading ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
