/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/AuthContext";
import {
  getSpaces,
  getSpace,
  movePlantToSpace,
  Space,
} from "@/lib/firebase/spaces";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";

export default function MovePlantPageWrapper({
  params,
}: {
  params: Promise<{ spaceId: string; id: string }>;
}) {
  return (
    <ProtectedRoute>
      <MovePlantPage params={params} />
    </ProtectedRoute>
  );
}

function MovePlantPage({
  params,
}: {
  params: Promise<{ spaceId: string; id: string }>;
}) {
  const { spaceId, id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [plant, setPlant] = useState<any>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Load plant
      const ref = doc(db, `users/${user.uid}/spaces/${spaceId}/plants/${id}`);
      const snap = await getDoc(ref);
      if (snap.exists()) setPlant({ id: snap.id, ...snap.data() });

      // Load spaces (exclude current space)
      const allSpaces = await getSpaces(user.uid);
      const otherSpaces = allSpaces.filter((s) => s.id !== spaceId);
      setSpaces(otherSpaces);
      if (otherSpaces.length > 0) setSelectedSpaceId(otherSpaces[0].id);

      setLoading(false);
    };
    load();
  }, [user, spaceId, id]);

  async function handleMove() {
    if (!user || !selectedSpaceId) return;
    setSaving(true);
    try {
      const newPlantId = await movePlantToSpace(
        user.uid,
        spaceId,
        id,
        selectedSpaceId,
      );
      router.push(`/plant/${selectedSpaceId}/${newPlantId}`);
    } catch (e) {
      console.error("Error moving plant:", e);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-swansons-green border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 pt-8 pb-36 max-w-lg mx-auto">
      {/* Plant name */}
      <div className="flex justify-center mb-6">
        <img
          src="/images/add_plant_check_mark.png"
          alt="Move"
          width={100}
          height={100}
        />
      </div>

      <h2 className="font-heading text-3xl font-bold text-swansons-navy text-center mb-2 leading-tight">
        Move <span className="italic">{plant?.commonName}</span>
      </h2>
      <p className="font-body text-swansons-muted text-center mb-8">
        Select a new space for this plant
      </p>

      {spaces.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center">
          <p className="font-body text-swansons-muted">
            No other spaces available. Create a new space first.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-[260px]">
            <select
              className="w-full border-2 border-swansons-navy text-swansons-navy font-body font-semibold py-4 rounded-full text-base bg-transparent px-6 appearance-none"
              value={selectedSpaceId}
              onChange={(e) => setSelectedSpaceId(e.target.value)}
            >
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
        </div>
      )}

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-swansons-navy px-6 py-5 flex flex-col items-center gap-3">
        <Button
          onClick={handleMove}
          disabled={saving || !selectedSpaceId}
          variant="inverted"
          className="w-full max-w-sm"
        >
          {saving ? "Moving..." : "Move Plant"}
        </Button>
        <Button
          onClick={() => router.back()}
          variant="text"
          className="text-white"
        >
          Cancel
        </Button>
      </div>
    </main>
  );
}
