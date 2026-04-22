/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/AuthContext";
import {
  getSpaces,
  getPlantsInSpace,
  deletePlant,
} from "@/lib/firebase/spaces";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Link from "next/link";

export default function MyPlantsPage() {
  const { user, loading } = useAuth();
  const [spaces, setSpaces] = useState<any[]>([]);
  const [plantsBySpace, setPlantsBySpace] = useState<Record<string, any[]>>({});
  const [spacesLoading, setSpacesLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadSpacesAndPlants = async (uid: string) => {
      const fetchedSpaces = await getSpaces(uid);
      setSpaces(fetchedSpaces);
      const allPlants: Record<string, any[]> = {};
      for (const space of fetchedSpaces) {
        const plants = await getPlantsInSpace(uid, space.id);
        allPlants[space.id] = plants;
      }
      setPlantsBySpace(allPlants);
      setSpacesLoading(false);
    };

    loadSpacesAndPlants(user.uid);
  }, [user]);

  const handleDeletePlant = async (spaceId: string, plantId: string) => {
    if (!user) return;
    const confirm = window.confirm("Remove this plant?");
    if (!confirm) return;
    setDeletingId(plantId);
    await deletePlant(user.uid, spaceId, plantId);

    // Reload plants after delete
    const fetchedSpaces = await getSpaces(user.uid);
    setSpaces(fetchedSpaces);
    const allPlants: Record<string, any[]> = {};
    for (const space of fetchedSpaces) {
      const plants = await getPlantsInSpace(user.uid, space.id);
      allPlants[space.id] = plants;
    }
    setPlantsBySpace(allPlants);
    setDeletingId(null);
  };

  if (loading || spacesLoading)
    return <p className="text-center mt-10">Loading...</p>;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-swansons-cream px-4 py-8 pb-20">
        <h1 className="text-xl font-semibold mb-6">My Plants</h1>
        {spaces.length === 0 ? (
          <div className="text-gray-500 text-center">No plants yet.</div>
        ) : (
          spaces.map((space) => (
            <section key={space.id} className="mb-8">
              <h2 className="text-lg font-bold mb-2">
                {space.name}{" "}
                <span className="text-xs text-gray-500">({space.type})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(plantsBySpace[space.id] || []).length === 0 ? (
                  <div className="text-gray-400 italic">
                    No plants in this space.
                  </div>
                ) : (
                  plantsBySpace[space.id].map((plant) => (
                    <div
                      key={plant.id}
                      className="bg-white rounded p-4 shadow flex flex-col gap-2"
                    >
                      <div className="h-24 w-full bg-gray-100 rounded mb-2 flex items-center justify-center text-3xl overflow-hidden">
                        {plant.photo ? (
                          <img
                            src={plant.photo}
                            alt={plant.commonName || "Plant photo"}
                            className="w-full h-full object-cover"
                            style={{ aspectRatio: "1/1", maxHeight: "6rem" }}
                          />
                        ) : (
                          "🌱"
                        )}
                      </div>
                      <div className="font-semibold">{plant.commonName}</div>
                      <Link
                        href={`/plant/${space.id}/${plant.id}`}
                        className="text-xs text-green-700 hover:text-green-900 underline transition"
                      >
                        View plant details
                      </Link>
                      <div className="text-xs text-gray-500 italic">
                        {plant.latinName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {space.type} / {plant.indoor ? "Indoor" : "Outdoor"}
                      </div>
                      <button
                        onClick={() => handleDeletePlant(space.id, plant.id)}
                        disabled={deletingId === plant.id}
                        className="mt-2 text-xs text-red-400 hover:text-red-600 transition cursor-pointer"
                      >
                        {deletingId === plant.id ? "Removing..." : "🗑 Remove"}
                      </button>
                      {/* Ask about this plant link removed; now on plant profile page */}
                    </div>
                  ))
                )}
              </div>
            </section>
          ))
        )}
      </main>
    </ProtectedRoute>
  );
}
