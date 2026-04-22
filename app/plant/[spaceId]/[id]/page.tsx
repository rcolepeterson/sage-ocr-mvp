/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { use } from "react";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { compressImage } from "@/lib/utils/imageCompression";
import { uploadPlantPhoto } from "@/lib/firebase/storage";
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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const photoInputRef = useRef<HTMLInputElement>(null);

  async function fetchPlantDoc() {
    if (!user || !spaceId || !id) return;
    const ref = doc(db, `users/${user.uid}/spaces/${spaceId}/plants/${id}`);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setPlant({ id: snap.id, ...snap.data() });
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPlantDoc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, spaceId, id]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const compressed = await compressImage(file);
      const photoUrl = await uploadPlantPhoto(
        user.uid,
        spaceId,
        id,
        compressed,
        (progress) => setUploadProgress(progress),
      );
      // Update Firestore with new photo URL
      const ref = doc(db, `users/${user.uid}/spaces/${spaceId}/plants/${id}`);
      await setDoc(ref, { photo: photoUrl }, { merge: true });
      await fetchPlantDoc();
    } catch (err) {
      // Optionally handle error
      // eslint-disable-next-line no-console
      console.error("Photo upload error", err);
    }
    setUploading(false);
  }

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (!plant) return notFound();

  return (
    <main className="max-w-md mx-auto mt-8 p-6 pb-24 bg-white rounded shadow">
      {/* Hidden file input for photo update */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={photoInputRef}
        onChange={handlePhotoChange}
        disabled={uploading}
      />
      {/* Plant photo or placeholder, clickable */}
      <div
        className="relative cursor-pointer group"
        onClick={() => !uploading && photoInputRef.current?.click()}
        tabIndex={0}
        role="button"
        aria-label="Change plant photo"
      >
        {plant.photo ? (
          <img
            src={plant.photo}
            alt={plant.commonName}
            className="w-full h-48 object-cover rounded mb-2 border border-gray-200 group-hover:opacity-80 transition"
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 rounded mb-2 flex items-center justify-center text-5xl border border-gray-200 group-hover:opacity-80 transition">
            🌱
          </div>
        )}
        {/* Progress overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded">
            <div className="text-green-700 text-lg font-semibold mb-1">
              Uploading...
            </div>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {uploadProgress.toFixed(0)}%
            </div>
          </div>
        )}
      </div>
      {/* Tap to change photo hint */}
      <div className="text-xs text-gray-500 text-center mb-2 flex items-center justify-center gap-1 select-none">
        <span className="text-base">📷</span> Tap to change photo
      </div>
      <h1 className="text-2xl font-bold mb-1">{plant.commonName}</h1>
      <p className="italic text-gray-500 mb-4">{plant.latinName}</p>
      <div className="flex flex-col gap-2 text-sm mb-4">
        <div>
          <span className="font-semibold">Light: </span>
          {plant.careInfo?.light || plant.lightLevel || "—"}
        </div>
        <div>
          <span className="font-semibold">Water: </span>
          {plant.water || plant.careInfo?.water || "—"}
        </div>
      </div>
      <TagBadges tags={plant.tags || []} />
      <div className="mt-6">
        <Link
          href={`/ask?plantId=${spaceId}_${id}&plantName=${encodeURIComponent(plant.commonName)}`}
          className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold text-lg text-center block hover:bg-green-800 transition"
        >
          💬 Ask an Expert
        </Link>
      </div>
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
