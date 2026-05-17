/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/firebase/AuthContext";
import {
  getSpaces,
  getPlantsInSpace,
  deletePlant,
} from "@/lib/firebase/spaces";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function MyPlantsPage() {
  const { user, loading } = useAuth();
  const [spaces, setSpaces] = useState<any[]>([]);
  const [plantsBySpace, setPlantsBySpace] = useState<Record<string, any[]>>({});
  const [spacesLoading, setSpacesLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAll = useCallback(async (uid: string) => {
    const fetchedSpaces = await getSpaces(uid);
    setSpaces(fetchedSpaces);
    const allPlants: Record<string, any[]> = {};
    for (const space of fetchedSpaces) {
      allPlants[space.id] = await getPlantsInSpace(uid, space.id);
    }
    setPlantsBySpace(allPlants);
    setSpacesLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadAll(user.uid);
  }, [user, loadAll]);

  async function handleDeletePlant(spaceId: string, plantId: string) {
    if (!user) return;
    if (!window.confirm("Remove this plant?")) return;
    setDeletingId(plantId);
    await deletePlant(user.uid, spaceId, plantId);
    await loadAll(user.uid);
    setDeletingId(null);
  }

  function getSpaceTags(space: any): string[] {
    const tags: string[] = [];
    if (space.type === "indoor") tags.push("Indoor");
    if (space.type === "outdoor") tags.push("Outdoor");
    return tags;
  }

  if (loading || spacesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-swansons-green border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-swansons-cream px-4 pt-8 pb-28">
        <h1 className="mb-8 pb-10 border-b border-swansons-navy">
          Your spaces
        </h1>

        {spaces.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="font-body text-swansons-muted">
              No spaces yet — scan a plant tag to get started.
            </p>
          </div>
        ) : (
          spaces.map((space) => {
            const plants = plantsBySpace[space.id] || [];
            const spaceTags = getSpaceTags(space);

            return (
              <section key={space.id} className="mb-10">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-body font-bold text-swansons-navy uppercase tracking-widest text-sm mb-2">
                      {space.name}
                    </p>
                    {spaceTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {spaceTags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-swansons-green-dark text-white font-body text-xs px-3 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="w-8 h-8 bg-swansons-navy rounded-full flex items-center justify-center shrink-0 ml-3">
                    <span className="text-white text-xs">✏️</span>
                  </button>
                </div>

                {plants.length === 0 ? (
                  <div className="bg-white rounded-2xl p-5 text-center">
                    <p className="font-body text-swansons-muted text-sm italic">
                      No plants in this space yet.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {plants.map((plant) => (
                      <div
                        key={plant.id}
                        className="bg-white rounded-2xl p-4 relative"
                      >
                        <Link
                          href={`/plant/${space.id}/${plant.id}`}
                          className="absolute top-3 right-3 w-8 h-8 bg-swansons-navy rounded-full flex items-center justify-center"
                        >
                          <span className="text-white text-xs">✏️</span>
                        </Link>

                        <div className="flex items-center gap-4 mb-4 pr-10">
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-swansons-green-muted shrink-0 flex items-center justify-center">
                            {plant.photo ? (
                              <img
                                src={plant.photo}
                                alt={plant.commonName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl">🌱</span>
                            )}
                          </div>
                          <div>
                            <p className="font-heading font-semibold text-swansons-navy leading-tight">
                              {plant.commonName}
                            </p>
                            <p className="font-body italic text-swansons-muted text-sm">
                              {plant.latinName}
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/ask?plantId=${space.id}_${plant.id}&plantName=${encodeURIComponent(plant.commonName)}`}
                        >
                          <Button
                            variant="primary"
                            className="w-full rounded-full mx-auto block"
                          >
                            Ask An Expert
                          </Button>
                        </Link>

                        <button
                          onClick={() => handleDeletePlant(space.id, plant.id)}
                          disabled={deletingId === plant.id}
                          className="w-full text-center font-body text-xs text-swansons-muted mt-2 hover:text-red-400 transition"
                        >
                          {deletingId === plant.id
                            ? "Removing..."
                            : "Remove plant"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })
        )}
      </main>
    </ProtectedRoute>
  );
}
