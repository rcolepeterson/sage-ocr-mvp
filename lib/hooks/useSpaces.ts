import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/AuthContext";
import {
  getSpaces,
  getPlantsInSpace,
  Space,
  Plant,
} from "@/lib/firebase/spaces";

export function useSpaces() {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [plantCounts, setPlantCounts] = useState<Record<string, number>>({});
  const [plantPhotos, setPlantPhotos] = useState<Record<string, string[]>>({});
  const [latestPlant, setLatestPlant] = useState<{
    plant: Plant;
    spaceId: string;
    plantId: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const fetchedSpaces = await getSpaces(user.uid);
      setSpaces(fetchedSpaces);

      let newest: { plant: Plant; spaceId: string; plantId: string } | null =
        null;
      const counts: Record<string, number> = {};
      const photos: Record<string, string[]> = {};

      await Promise.all(
        fetchedSpaces.map(async (space) => {
          const plants = await getPlantsInSpace(user.uid, space.id);
          counts[space.id] = plants.length;
          photos[space.id] = plants
            .slice(0, 3)
            .map((p) => p.photo)
            .filter(Boolean);

          plants.forEach((plant) => {
            if (
              !newest ||
              (plant.createdAt?.toMillis?.() ?? 0) >
                (newest.plant.createdAt?.toMillis?.() ?? 0)
            ) {
              newest = { plant, spaceId: space.id, plantId: plant.id };
            }
          });
        }),
      );

      setPlantCounts(counts);
      setPlantPhotos(photos);
      setLatestPlant(newest);
      setLoading(false);
    };

    fetch();
  }, [user]);

  return { spaces, plantCounts, plantPhotos, latestPlant, loading };
}
