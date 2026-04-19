/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { use } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { notFound } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const TAG_CATEGORIES = [
  {
    label: "Plant Type",
    tags: [
      "fruit-tree",
      "ornamental-tree",
      "evergreen-tree",
      "deciduous-shrub",
      "evergreen-shrub",
      "flowering-shrub",
      "shade-perennial",
      "sun-perennial",
      "ornamental-grass",
      "ground-cover",
      "climbing-vine",
      "annual-flower",
      "tropical-annual",
      "bulb",
      "fern",
      "hosta",
      "rose",
      "rhododendron",
      "azalea",
      "hydrangea",
      "lavender",
      "herb",
      "vegetable-starts",
      "tomato",
      "berry-bush",
      "succulent",
      "houseplant",
      "bonsai",
      "water-plant",
      "edible-flower",
    ],
  },
  {
    label: "Light",
    tags: [
      "full-sun-plant",
      "part-shade-plant",
      "full-shade-plant",
      "adaptable-light",
    ],
  },
  {
    label: "Water",
    tags: [
      "drought-tolerant",
      "moderate-water",
      "high-water",
      "moisture-lover",
    ],
  },
  {
    label: "Seasonal",
    tags: [
      "spring-bloomer",
      "summer-bloomer",
      "fall-bloomer",
      "winter-interest",
      "spring-ephemeral",
      "deciduous",
      "evergreen",
    ],
  },
  {
    label: "Care Complexity",
    tags: ["beginner-friendly", "intermediate-care", "expert-care"],
  },
  {
    label: "Pest & Disease",
    tags: [
      "slug-risk",
      "aphid-risk",
      "powdery-mildew-risk",
      "deer-risk",
      "root-rot-risk",
      "virus-risk",
      "scale-risk",
    ],
  },
  {
    label: "Container",
    tags: [
      "container-friendly",
      "needs-ground-space",
      "raised-bed-ideal",
      "hanging-basket",
    ],
  },
  {
    label: "PNW Specific",
    tags: [
      "pnw-native",
      "pnw-adapted",
      "rain-tolerant",
      "heat-sensitive",
      "frost-tender",
      "winter-hardy",
    ],
  },
  {
    label: "Upsell",
    tags: [
      "needs-fertilizer-spring",
      "needs-fertilizer-fall",
      "needs-pruning-tools",
      "needs-support-structure",
      "needs-soil-amendment",
      "needs-pest-control",
      "needs-mulch",
      "pot-upgrade-candidate",
      "companion-planting-opportunity",
    ],
  },
];

function TagBadges({ tags }: { tags: string[] }) {
  return (
    <div className="mt-4">
      <div className="text-xs font-semibold mb-2">
        🏷️ AI Tags (staff/admin testing)
      </div>
      {!tags || tags.length === 0 ? (
        <div className="text-xs text-gray-400 italic">
          No tags assigned yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {TAG_CATEGORIES.map((cat) => {
            const catTags = tags.filter((t) => cat.tags.includes(t));
            if (catTags.length === 0) return null;
            return (
              <div key={cat.label}>
                <span className="text-xs font-bold mr-2">{cat.label}:</span>
                {catTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs font-medium mr-1 mb-1 border border-green-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlantProfilePage({
  params,
}: {
  params: Promise<{ spaceId: string; id: string }>;
}) {
  const { spaceId, id } = use(params);
  const { user } = useAuth();
  const [plant, setPlant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !spaceId || !id) return;
    const fetchPlant = async () => {
      const ref = doc(db, `users/${user.uid}/spaces/${spaceId}/plants/${id}`);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setPlant({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    };
    fetchPlant();
  }, [user, spaceId, id]);

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (!plant) return notFound();

  return (
    <main className="max-w-md mx-auto mt-8 p-6 pb-24 bg-white rounded shadow">
      {plant.photo && (
        <img
          src={plant.photo}
          alt={plant.commonName}
          className="w-full h-48 object-cover rounded mb-4"
        />
      )}
      {!plant.photo && (
        <div className="w-full h-48 bg-gray-100 rounded mb-4 flex items-center justify-center text-5xl">
          🌱
        </div>
      )}
      <h1 className="text-2xl font-bold mb-1">{plant.commonName}</h1>
      <p className="italic text-gray-500 mb-4">{plant.latinName}</p>
      <div className="flex flex-col gap-2 text-sm mb-4">
        <div>
          <span className="font-semibold">Light: </span>
          {plant.lightLevel || plant.light || "—"}
        </div>
        <div>
          <span className="font-semibold">Water: </span>
          {plant.water || "—"}
        </div>
      </div>
      <TagBadges tags={plant.tags || []} />
    </main>
  );
}

export default function PlantPageWrapper({
  params,
}: {
  params: Promise<{ spaceId: string; id: string }>;
}) {
  return (
    <ProtectedRoute>
      <PlantProfilePage params={params} />
    </ProtectedRoute>
  );
}
