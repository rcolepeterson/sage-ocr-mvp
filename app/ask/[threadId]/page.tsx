/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/firebase/AuthContext";
import { useEffect, useState } from "react";
import { subscribeToThread, addReply } from "@/lib/firebase/threads";
import { useParams } from "next/navigation";

export default function ThreadDetailPage() {
  const { user, loading } = useAuth();
  const { threadId } = useParams() as { threadId: string };
  const [thread, setThread] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Real time listener for thread + replies
  useEffect(() => {
    if (!threadId) return;
    const unsub = subscribeToThread(threadId, setThread);
    return () => unsub();
  }, [threadId]);

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
      <main className="min-h-screen bg-swansons-cream flex flex-col items-center px-4 py-8">
        <div className="card w-full max-w-md p-6 mb-8">
          <h1 className="text-xl font-semibold mb-2">Thread</h1>
          <div className="mb-2">
            <span className="font-medium">Q: {thread.question}</span>
            <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
              {thread.status}
            </span>
          </div>
          <div className="mb-4">
            <h2 className="text-sm font-medium mb-1">Replies</h2>
            <ul className="space-y-2">
              {thread.replies && thread.replies.length > 0 ? (
                thread.replies.map((r: any) => (
                  <li
                    key={r.id}
                    className="bg-white rounded p-2 shadow flex flex-col"
                  >
                    <span className="text-xs text-gray-500 mb-1">
                      {r.isStaff ? "Staff" : "You"}
                    </span>
                    <span>{r.message}</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 text-sm">No replies yet.</li>
              )}
            </ul>
          </div>
          <form onSubmit={handleReply} className="flex flex-col gap-2">
            <textarea
              className="input min-h-[60px]"
              placeholder="Type a follow-up message..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={submitting || !reply.trim()}
            >
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
}
