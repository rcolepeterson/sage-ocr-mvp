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

export default function AdminInboxPage() {
  const { user, loading } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Real time listener for all threads
  useEffect(() => {
    const unsub = subscribeToAllThreads(setThreads);
    return () => unsub();
  }, []);

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

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !user || !selectedThread) return;
    setSubmitting(true);
    await addReply(selectedThread.id, user.uid, reply.trim(), true);
    setReply("");
    setSubmitting(false);
  };

  const handleStatus = async (
    status: "pending" | "answered" | "needs-followup",
  ) => {
    if (!selectedThread) return;
    await updateThreadStatus(selectedThread.id, status);
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <ProtectedRoute>
      <main className="h-screen bg-swansons-cream flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
          <h1 className="text-xl font-semibold">Staff Inbox</h1>
        </div>

        {/* Split Pane */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel — Thread List */}
          <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
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
                  <span className="font-medium text-sm">{thread.question}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600 self-start">
                    {thread.status}
                  </span>
                </div>
              ))}
              {threads.length === 0 && (
                <p className="text-gray-500 text-sm">No open threads.</p>
              )}
            </div>
          </div>

          {/* Right Panel — Thread Detail */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedThread ? (
              <>
                {/* Fixed Thread Header */}
                <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
                  <p className="font-medium">Q: {selectedThread.question}</p>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    {selectedThread.status}
                  </span>
                </div>

                {/* Scrollable Replies */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  {selectedThread.replies &&
                  selectedThread.replies.length > 0 ? (
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
                          {r.isStaff ? "Staff" : "Customer"}
                        </span>
                        <span className="text-sm">{r.message}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No replies yet.</p>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Fixed Bottom — Reply Box + Button */}
                <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-white">
                  <form onSubmit={handleReply} className="flex flex-col gap-2">
                    <textarea
                      className="input min-h-[60px]"
                      placeholder="Type a reply..."
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary flex-1"
                        disabled={submitting || !reply.trim()}
                      >
                        {submitting ? "Sending..." : "Send Reply"}
                      </button>
                      <button
                        type="button"
                        className="btn bg-green-200 cursor-pointer px-4"
                        onClick={() => handleStatus("answered")}
                      >
                        Mark Answered
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
    </ProtectedRoute>
  );
}
