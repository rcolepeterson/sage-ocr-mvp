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
      <main className="min-h-screen bg-swansons-cream flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-2xl flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h1 className="text-xl font-semibold mb-4">Staff Inbox</h1>
            <ul className="space-y-2">
              {threads.map((thread) => (
                <li
                  key={thread.id}
                  className={`bg-white rounded p-3 shadow flex flex-col cursor-pointer ${
                    selectedThread?.id === thread.id
                      ? "border-2 border-green-600"
                      : ""
                  }`}
                  onClick={() => handleSelectThread(thread.id)}
                >
                  <span className="font-medium">{thread.question}</span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 ml-2">
                    {thread.status}
                  </span>
                </li>
              ))}
              {threads.length === 0 && (
                <li className="text-gray-500 text-sm">No open threads.</li>
              )}
            </ul>
          </div>
          <div className="flex-1">
            {selectedThread ? (
              <div className="card p-4">
                <h2 className="text-lg font-medium mb-2">Thread Detail</h2>
                <div className="mb-2">
                  <span className="font-medium">
                    Q: {selectedThread.question}
                  </span>
                  <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                    {selectedThread.status}
                  </span>
                </div>
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-1">Replies</h3>
                  <ul className="space-y-2">
                    {selectedThread.replies &&
                    selectedThread.replies.length > 0 ? (
                      selectedThread.replies.map((r: any) => (
                        <li
                          key={r.id}
                          className="bg-gray-50 rounded p-2 flex flex-col"
                        >
                          <span className="text-xs text-gray-500 mb-1">
                            {r.isStaff ? "Staff" : "Customer"}
                          </span>
                          <span>{r.message}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500 text-sm">No replies yet.</li>
                    )}
                  </ul>
                  <div ref={bottomRef} />
                </div>
                <form onSubmit={handleReply} className="flex flex-col gap-2">
                  <textarea
                    className="input min-h-[60px]"
                    placeholder="Type a reply..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={submitting || !reply.trim()}
                  >
                    {submitting ? "Sending..." : "Send Reply"}
                  </button>
                </form>
                <div className="flex gap-2 mt-4">
                  <button
                    className="btn btn-xs bg-yellow-200"
                    onClick={() => handleStatus("pending")}
                  >
                    Mark Pending
                  </button>
                  <button
                    className="btn btn-xs bg-green-200"
                    onClick={() => handleStatus("answered")}
                  >
                    Mark Answered
                  </button>
                  <button
                    className="btn btn-xs bg-red-200"
                    onClick={() => handleStatus("needs-followup")}
                  >
                    Needs Follow-up
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm mt-8">
                Select a thread to view details.
              </div>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
