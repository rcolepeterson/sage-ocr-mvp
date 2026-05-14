/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type { Space, Plant } from "@/lib/firebase/spaces";
import { getSpaces, getPlantsInSpace } from "@/lib/firebase/spaces";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/firebase/AuthContext";
import { useState, useEffect } from "react";
import { createThread, subscribeToThreads } from "@/lib/firebase/threads";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import NotificationBanner from "@/components/ui/NotificationBanner";

export default function AskPage() {
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
  const searchParams = useSearchParams();

  const urlPlantId = searchParams.get("plantId") || "";
  const urlPlantName = searchParams.get("plantName") || "";

  // Real time listener for user's threads
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToThreads(user.uid, setThreads);
    return () => unsub();
  }, [user]);

  // Fetch spaces on mount if no plantId in URL
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
    let threadPlantId = urlPlantId;
    let threadPlantName = urlPlantName;
    if (!urlPlantId && selectedPlantId) {
      threadPlantId = selectedPlantId;
      threadPlantName = selectedPlantName;
    }
    await createThread(
      threadPlantId,
      user.uid,
      question.trim(),
      threadPlantName,
    );
    setQuestion("");
    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-swansons-cream flex flex-col items-center px-4 py-8 pb-20">
        <div className="card w-full max-w-md p-6 mb-8">
          <h1 className="text-xl font-semibold mb-1">Ask an Expert</h1>

          {/* Plant Context Banner if navigated from plant profile */}
          {urlPlantName ? (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
              <span className="text-lg">🌱</span>
              <div>
                <p className="text-xs text-green-600 font-medium">
                  Asking about:
                </p>
                <p className="text-sm text-green-800 font-semibold">
                  {urlPlantName}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Optional Space Dropdown */}
              {spaces.length > 0 && (
                <select
                  className="input mb-2"
                  value={selectedSpaceId}
                  onChange={(e) => handleSpaceChange(e.target.value)}
                  aria-label="Select a space"
                >
                  <option value="">Add a space (optional)</option>
                  {spaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))}
                </select>
              )}
              {/* Optional Plant Dropdown */}
              {selectedSpaceId && plants.length > 0 && (
                <select
                  className="input mb-2"
                  value={selectedPlantId}
                  onChange={(e) => {
                    const plant = plants.find((p) => p.id === e.target.value);
                    setSelectedPlantId(e.target.value);
                    setSelectedPlantName(plant ? plant.commonName : "");
                  }}
                  aria-label="Select a plant"
                >
                  <option value="">Select a plant (optional)</option>
                  {plants.map((plant) => (
                    <option key={plant.id} value={plant.id}>
                      {plant.commonName}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <textarea
              className="input min-h-20"
              placeholder={
                urlPlantName
                  ? `What would you like to know about your ${urlPlantName}?`
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

        {/* Notification banner — appears after the first question is submitted */}
        {user && (
          <div className="w-full max-w-md mb-6">
            <NotificationBanner
              uid={user.uid}
              message="Want to know when an expert replies? Enable notifications"
              show={submitted}
            />
          </div>
        )}

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
                    {(() => {
                      switch (thread.status) {
                        case "new":
                        case "assigned":
                        case "needs-followup":
                          return "⏳ Sent";
                        case "waiting-on-customer":
                          return "💬 Replied";
                        case "closed":
                          return "✅ Closed";
                        default:
                          return thread.status;
                      }
                    })()}
                  </span>
                </div>
                {thread.plantName && (
                  <span className="text-xs text-green-600 mt-0.5">
                    🌱 {thread.plantName}
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
