/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  deleteDoc,
  arrayUnion,
} from "firebase/firestore";
// Delete a plant from a space
export async function deletePlant(
  userId: string,
  spaceId: string,
  plantId: string,
): Promise<void> {
  const plantRef = doc(
    db,
    `users/${userId}/spaces/${spaceId}/plants/${plantId}`,
  );
  await deleteDoc(plantRef);

  // Recalculate user's plant tag index from remaining plants
  const spacesSnap = await getDocs(collection(db, `users/${userId}/spaces`));
  const allTags: string[] = [];
  await Promise.all(
    spacesSnap.docs.map(async (spaceDoc) => {
      const plantsSnap = await getDocs(
        collection(db, `users/${userId}/spaces/${spaceDoc.id}/plants`),
      );
      plantsSnap.docs.forEach((p) => {
        const tags = p.data().tags || [];
        allTags.push(...tags);
      });
    }),
  );
  const uniqueTags = [...new Set(allTags)];
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, { plantTags: uniqueTags }, { merge: true });
}
import { db } from "./firestore";

export type SpaceType = "indoor" | "outdoor";

export interface Space {
  id: string;
  name: string;
  type: SpaceType;
  createdAt: any;
}

export interface Plant {
  id: string;
  commonName: string;
  latinName: string;
  photo: string;
  lightLevel: "low" | "medium" | "high";
  container: boolean;
  indoor: boolean;
  careInfo: any;
  tags?: string[];
  createdAt: any;
}

export async function movePlantToSpace(
  userId: string,
  fromSpaceId: string,
  plantId: string,
  toSpaceId: string,
): Promise<string> {
  // Get the existing plant data
  const plantRef = doc(
    db,
    `users/${userId}/spaces/${fromSpaceId}/plants/${plantId}`,
  );
  const snap = await getDoc(plantRef);
  if (!snap.exists()) throw new Error("Plant not found");

  const plantData = snap.data() as Omit<Plant, "id">;

  // Save to new space
  const newPlantRef = doc(
    collection(db, `users/${userId}/spaces/${toSpaceId}/plants`),
  );
  await setDoc(newPlantRef, { ...plantData });

  // Delete from old space
  await deleteDoc(plantRef);

  return newPlantRef.id;
}

export async function createSpace(
  userId: string,
  name: string,
  type: SpaceType,
) {
  const spaceRef = doc(collection(db, `users/${userId}/spaces`));
  const space: Omit<Space, "id"> = {
    name,
    type,
    createdAt: serverTimestamp(),
  };
  await setDoc(spaceRef, space);
  return spaceRef.id;
}

export async function getSpaces(userId: string): Promise<Space[]> {
  const q = collection(db, `users/${userId}/spaces`);
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Space);
}

export async function getSpace(
  userId: string,
  spaceId: string,
): Promise<Space | null> {
  const ref = doc(db, `users/${userId}/spaces/${spaceId}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Space;
}

// Delete a space and all its plants
export async function deleteSpace(
  userId: string,
  spaceId: string,
): Promise<void> {
  // Delete all plants in the space first
  const plantsSnap = await getDocs(
    collection(db, `users/${userId}/spaces/${spaceId}/plants`),
  );
  await Promise.all(plantsSnap.docs.map((p) => deleteDoc(p.ref)));

  // Then delete the space
  await deleteDoc(doc(db, `users/${userId}/spaces/${spaceId}`));
}

export async function savePlantToSpace(
  userId: string,
  spaceId: string,
  plantData: Omit<Plant, "id" | "createdAt"> & {
    careInfo: any;
    tags?: string[];
  },
  photoUrl?: string,
) {
  const plantRef = doc(
    collection(db, `users/${userId}/spaces/${spaceId}/plants`),
  );
  const plant: Omit<Plant, "id"> = {
    ...plantData,
    photo: photoUrl || "",
    tags: plantData.tags || [],
    createdAt: serverTimestamp(),
  };
  await setDoc(plantRef, plant);

  // Update user's plant tag index
  if (plantData.tags && plantData.tags.length > 0) {
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      { plantTags: arrayUnion(...plantData.tags) },
      { merge: true },
    );
  }

  return plantRef.id;
}

// Get all plants in a space
export async function getPlantsInSpace(
  userId: string,
  spaceId: string,
): Promise<Plant[]> {
  const q = collection(db, `users/${userId}/spaces/${spaceId}/plants`);
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Plant);
}
