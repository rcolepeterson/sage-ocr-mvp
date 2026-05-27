import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  getCountFromServer,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firestore";

export interface Broadcast {
  id: string;
  title: string;
  body: string;
  tags: string[];
  sendToAll: boolean;
  recipientCount: number;
  sentBy: string;
  sentByName: string;
  status: "sent" | "sending" | "failed";
  createdAt: Timestamp;
}

// Live recipient count query
export async function getRecipientCount(
  tags: string[],
  sendToAll: boolean,
): Promise<number> {
  if (sendToAll) {
    const q = query(collection(db, "users"), where("role", "==", "customer"));
    const snap = await getCountFromServer(q);
    return snap.data().count;
  }

  if (tags.length === 0) return 0;

  const q = query(
    collection(db, "users"),
    where("role", "==", "customer"),
    where("plantTags", "array-contains-any", tags.slice(0, 30)),
  );
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

// Real-time listener for the admin broadcast history log
export function onBroadcastsSnapshot(
  callback: (broadcasts: Broadcast[]) => void,
): () => void {
  const q = query(collection(db, "broadcasts"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const broadcasts = snap.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Broadcast,
    );
    callback(broadcasts);
  });
}
