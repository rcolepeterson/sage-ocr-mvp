/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/firebase/AuthContext";
import { useEffect, useState, useRef } from "react";
import { subscribeToThread, addReply } from "@/lib/firebase/threads";
import { useParams } from "next/navigation";

const getCustomerStatus = (status: string) => {
  switch (status) {
    case "answered":
      return "✅ Answered";
    case "pending":
    case "needs-followup":
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
    if (!reply.trim() || !user) return;
    setSubmitting(true);
    await addReply(threadId, user.uid, reply.trim(), false);
    setReply("");
    setSubmitting(false);
  };

  if (loading || !thread)
    return <p className="text-center mt-10">Loading...</p>;

  return (
    <ProtectedRoute>
      <main className="h-screen flex flex-col bg-swansons-cream overflow-hidden">
        <div className="flex flex-col h-full w-full max-w-screen-lg mx-auto bg-white shadow-sm">
          {/* Fixed Header */}
          <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200 bg-white">
            <p className="font-medium text-sm">{thread.question}</p>
            <span
              className={`text-xs p-2  rounded mt-1 inline-block ${
                thread.status === "answered"
                  ? "bg-green-100 text-green-700"
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
          <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 bg-white">
            <form onSubmit={handleReply} className="flex flex-col gap-2">
              <textarea
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-600 min-h-[60px]"
                placeholder="Send a message..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleReply(e as any);
                  }
                }}
              />
              <button
                type="submit"
                className="w-full rounded-full bg-green-700 text-white py-2 text-sm font-medium hover:bg-green-800 transition disabled:opacity-50"
                disabled={submitting || !reply.trim()}
              >
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
