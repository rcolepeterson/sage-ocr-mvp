export async function uploadThreadPhoto(
  userId: string,
  threadId: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const timestamp = Date.now();
  const storageRef = ref(storage, `threads/${threadId}/${timestamp}.jpg`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (onProgress) {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      },
    );
  });
}
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { app } from "./config";

const storage = getStorage(app);

export async function uploadPlantPhoto(
  userId: string,
  spaceId: string,
  plantId: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const timestamp = Date.now();
  const storageRef = ref(
    storage,
    `users/${userId}/plants/${plantId}/${timestamp}.jpg`,
  );
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (onProgress) {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      },
    );
  });
}

export async function deletePlantPhoto(photoURL: string): Promise<void> {
  const photoRef = ref(storage, photoURL);
  await deleteObject(photoRef);
}
