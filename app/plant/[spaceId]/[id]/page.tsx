/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { use } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { compressImage } from "@/lib/utils/imageCompression";
import { uploadPlantPhoto } from "@/lib/firebase/storage";
import { notFound } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import EditIcon from "@/components/ui/EditIcon";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import { getSpace } from "@/lib/firebase/spaces";
import { motion } from "motion/react";

/* ─── Tag Badges — staff/admin only ─────────────────────────────────────── */
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
  if (!tags || tags.length === 0) return null;
  return (
    <div className="mt-6 bg-white rounded-2xl p-4">
      <p className="text-xs font-body font-semibold uppercase tracking-widest text-swansons-muted mb-3">
        🏷️ AI Tags — staff/admin
      </p>
      <div className="flex flex-col gap-2">
        {TAG_CATEGORIES.map((cat) => {
          const catTags = tags.filter((t) => cat.tags.includes(t));
          if (catTags.length === 0) return null;
          return (
            <div key={cat.label}>
              <span className="text-xs font-body font-bold text-swansons-text mr-2">
                {cat.label}:
              </span>
              {catTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block bg-swansons-green-muted text-swansons-navy rounded-full px-2 py-0.5 text-xs font-body mr-1 mb-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Animation variants ────────────────────────────────────────────────── */
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

/* ─── Plant Profile ──────────────────────────────────────────────────────── */
function PlantProfilePage({
  params,
}: {
  params: Promise<{ spaceId: string; id: string }>;
}) {
  const { spaceId, id } = use(params);
  const { user } = useAuth();
  const [plant, setPlant] = useState<any>(null);
  const [space, setSpace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  async function fetchPlantDoc() {
    if (!user || !spaceId || !id) return;
    const ref = doc(db, `users/${user.uid}/spaces/${spaceId}/plants/${id}`);
    const snap = await getDoc(ref);
    if (snap.exists()) setPlant({ id: snap.id, ...snap.data() });
    setLoading(false);
  }

  useEffect(() => {
    fetchPlantDoc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, spaceId, id]);

  useEffect(() => {
    if (!user || !spaceId) return;
    getSpace(user.uid, spaceId).then(setSpace);
  }, [user, spaceId]);

  async function handlePhotoFile(file: File) {
    if (!user) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const compressed = await compressImage(file);
      const photoUrl = await uploadPlantPhoto(
        user.uid,
        spaceId,
        id,
        compressed,
        (p) => setUploadProgress(p),
      );
      const ref = doc(db, `users/${user.uid}/spaces/${spaceId}/plants/${id}`);
      await setDoc(ref, { photo: photoUrl }, { merge: true });
      await fetchPlantDoc();
    } catch (err) {
      console.error("Photo upload error", err);
    }
    setUploading(false);
  }

  const spaceTags: string[] = [];
  if (plant?.indoor !== undefined)
    spaceTags.push(plant.indoor ? "Indoor" : "Outdoor");
  if (plant?.lightLevel) {
    const lightMap: Record<string, string> = {
      high: "Full sun",
      medium: "Part shade",
      low: "Full shade",
    };
    spaceTags.push(lightMap[plant.lightLevel] || plant.lightLevel);
  }
  if (plant?.container !== undefined)
    spaceTags.push(plant.container ? "Container" : "In-ground");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-swansons-green border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!plant) return notFound();

  return (
    <main className="min-h-screen pb-28">
      <motion.div
        className="px-4 pt-8 max-w-lg mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* ── Photo circle ── */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center mb-5"
        >
          <div className="relative">
            <div className="w-32 h-32 rounded-full ring-4 ring-swansons-green overflow-hidden bg-swansons-green-muted flex items-center justify-center">
              {plant.photo ? (
                <img
                  src={plant.photo}
                  alt={plant.commonName}
                  className="w-full h-full object-cover"
                />
              ) : (
                // <span className="text-5xl">🌱</span>
                <img
                  src="/images/PlantProfileIcon.png"
                  alt="Plant"
                  className="w-full h-full object-contain p-1"
                />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-full">
                  <span className="text-xs font-body text-swansons-green">
                    {uploadProgress.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
            {/* Edit pencil — uses PhotoPicker */}
            <PhotoPicker onFile={handlePhotoFile} disabled={uploading}>
              <button
                className="absolute bottom-0 right-0 w-8 h-8 bg-swansons-navy rounded-full flex items-center justify-center shadow-md"
                aria-label="Change plant photo"
              >
                <EditIcon width={16} height={16} />
              </button>
            </PhotoPicker>
          </div>
        </motion.div>

        {/* ── Name ── */}
        <motion.div variants={itemVariants}>
          <h1 className="font-heading text-3xl font-bold text-swansons-navy text-center mb-1">
            {plant.commonName}
          </h1>
          <p className="font-body italic text-swansons-black font-bold text-center mb-5">
            {plant.latinName}
          </p>
        </motion.div>

        {/* ── Description ── */}
        {plant.careInfo?.description && (
          <motion.div variants={itemVariants}>
            <p className="font-body text-swansons-text text-center leading-relaxed mb-6">
              {plant.careInfo.description}
            </p>
          </motion.div>
        )}

        {/* ── Light / Shade card ── */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-5 mb-4"
        >
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-body font-semibold uppercase tracking-widest text-swansons-muted">
              Light / Shade
            </span>
            <img
              src="/images/LightShadeIcon.svg"
              alt="Light / Shade"
              className="w-6 h-6"
            />
          </div>
          <p className="font-body text-swansons-text text-sm leading-relaxed">
            {plant.careInfo?.light || plant.lightLevel || "—"}
          </p>
        </motion.div>

        {/* ── Water / Soil card ── */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-5 mb-6"
        >
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-body font-semibold uppercase tracking-widest text-swansons-muted">
              Water / Soil
            </span>
            <img
              src="/images/WaterSoilIcon.svg"
              alt="Water / Soil"
              className="w-6 h-6"
            />
          </div>
          <p className="font-body text-swansons-text text-sm leading-relaxed">
            {plant.careInfo?.water || "—"}
          </p>
        </motion.div>

        {/* ── Care Tips ── */}
        {plant.careInfo?.careTips?.length > 0 && (
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex justify-center mb-4">
              <span className="bg-swansons-green-dark text-white font-body text-xs font-semibold uppercase tracking-widest px-6 py-2 rounded-full">
                Care Tips
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {plant.careInfo.careTips.map((tip: string, i: number) => (
                <div key={i} className="bg-white rounded-2xl p-4">
                  <p className="font-body text-swansons-text text-sm leading-relaxed">
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Space name + tags ── */}
        {space && (
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <p className="font-body font-bold text-swansons-navy uppercase tracking-widest text-sm">
                {space.name}
              </p>
              <Link
                href={`/plant/${spaceId}/${id}/move`}
                className="w-7 h-7 bg-swansons-navy rounded-full flex items-center justify-center shrink-0"
              >
                <EditIcon width={14} height={14} />
              </Link>
            </div>
            {spaceTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {spaceTags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-swansons-green-dark text-white font-body text-sm px-4 py-1.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── AI Tags — staff/admin ── */}
        <motion.div variants={itemVariants}>
          <TagBadges tags={plant.tags || []} />
        </motion.div>

        {/* ── Ask An Expert ── */}
        <motion.div
          variants={itemVariants}
          className="mt-6 flex justify-center"
        >
          <Link
            href={`/ask?plantId=${spaceId}_${id}&plantName=${encodeURIComponent(plant.commonName)}`}
          >
            <Button
              variant="primary"
              size="lg"
              className="rounded-full min-w-55"
            >
              Ask An Expert
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}

/* ─── Wrapper ────────────────────────────────────────────────────────────── */
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
