/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/firebase/AuthContext";
import { useState, useEffect } from "react";
import { createThread, subscribeToThreads } from "@/lib/firebase/threads";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function AskPage() {
  const { user, loading } = useAuth();
  const [question, setQuestion] = useState("");
  const [threads, setThreads] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const searchParams = useSearchParams();

  const plantId = searchParams.get("plantId") || "";
  const plantName = searchParams.get("plantName") || "";

  // Real time listener for user's threads
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToThreads(user.uid, setThreads);
    return () => unsub();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !user) return;
    setSubmitting(true);
    await createThread(plantId, user.uid, question.trim());
    setQuestion("");
    setSubmitting(false);
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-swansons-cream flex flex-col items-center px-4 py-8">
        <div className="card w-full max-w-md p-6 mb-8">
          <h1 className="text-xl font-semibold mb-1">Ask an Expert</h1>

          {/* Plant Context Banner */}
          {plantName && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
              <span className="text-lg">🌱</span>
              <div>
                <p className="text-xs text-green-600 font-medium">
                  Asking about:
                </p>
                <p className="text-sm text-green-800 font-semibold">
                  {plantName}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <textarea
              className="input min-h-[80px]"
              placeholder={
                plantName
                  ? `What would you like to know about your ${plantName}?`
                  : "Type your plant care question..."
              }
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={submitting || !question.trim()}
            >
              {submitting ? "Submitting..." : "Submit Question"}
            </button>
          </form>
        </div>

        <div className="w-full max-w-md">
          <h2 className="text-lg font-medium mb-2">Your Threads</h2>
          <ul className="space-y-2">
            {threads.map((thread) => (
              <li
                key={thread.id}
                className="bg-white rounded p-3 shadow flex flex-col"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{thread.question}</span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 ml-2">
                    {thread.status}
                  </span>
                </div>
                {thread.plantId && (
                  <span className="text-xs text-green-600 mt-0.5">
                    🌱 Plant question
                  </span>
                )}
                <Link
                  href={`/ask/${thread.id}`}
                  className="text-blue-600 text-xs mt-1 underline"
                >
                  View Thread
                </Link>
              </li>
            ))}
            {threads.length === 0 && (
              <li className="text-gray-500 text-sm">No threads yet.</li>
            )}
          </ul>
        </div>
      </main>
    </ProtectedRoute>
  );
}
