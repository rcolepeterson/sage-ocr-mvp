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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const fetchedSpaces = await getSpaces(user.uid);
      setSpaces(fetchedSpaces);

      const counts = await Promise.all(
        fetchedSpaces.map(async (space) => {
          const plants = await getPlantsInSpace(user.uid, space.id);
          return { id: space.id, count: plants.length };
        }),
      );

      setPlantCounts(
        counts.reduce((acc, { id, count }) => ({ ...acc, [id]: count }), {}),
      );
      setLoading(false);
    };

    fetch();
  }, [user]);

  return { spaces, plantCounts, loading };
}
