/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  deleteDoc,
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
  createdAt: any;
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

export async function savePlantToSpace(
  userId: string,
  spaceId: string,
  plantData: Omit<Plant, "id" | "createdAt"> & { careInfo: any },
  photoUrl?: string,
) {
  const plantRef = doc(
    collection(db, `users/${userId}/spaces/${spaceId}/plants`),
  );
  const plant: Omit<Plant, "id"> = {
    ...plantData,
    photo: photoUrl || "",
    createdAt: serverTimestamp(),
  };
  await setDoc(plantRef, plant);
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
