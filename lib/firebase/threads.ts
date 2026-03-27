/* eslint-disable @typescript-eslint/no-explicit-any */
// /lib/firebase/threads.ts
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firestore";

export interface Thread {
  id: string;
  plantId: string;
  userId: string;
  question: string;
  status: "pending" | "answered" | "needs-followup";
  createdAt: any;
}

export interface Reply {
  id: string;
  authorId: string;
  message: string;
  createdAt: any;
  isStaff: boolean;
}

// Create a new thread
export async function createThread(
  plantId: string,
  userId: string,
  question: string,
) {
  const threadRef = await addDoc(collection(db, "threads"), {
    plantId,
    userId,
    question,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return threadRef.id;
}

// Get all threads for a user (one time)
export async function getThreads(userId: string) {
  const q = query(
    collection(db, "threads"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Thread);
}

// Get a single thread with replies (one time)
export async function getThread(threadId: string) {
  const threadDoc = await getDoc(doc(db, "threads", threadId));
  if (!threadDoc.exists()) return null;
  const thread = { id: threadDoc.id, ...threadDoc.data() } as Thread;
  const repliesSnap = await getDocs(
    collection(db, "threads", threadId, "replies"),
  );
  const replies = repliesSnap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Reply,
  );
  return { ...thread, replies };
}

// Add a reply to a thread
export async function addReply(
  threadId: string,
  authorId: string,
  message: string,
  isStaff: boolean,
) {
  const replyRef = await addDoc(
    collection(db, "threads", threadId, "replies"),
    {
      authorId,
      message,
      isStaff,
      createdAt: serverTimestamp(),
    },
  );
  if (!isStaff) {
    await updateThreadStatus(threadId, "needs-followup");
  }
  return replyRef.id;
}

// Update thread status
export async function updateThreadStatus(
  threadId: string,
  status: "pending" | "answered" | "needs-followup",
) {
  await updateDoc(doc(db, "threads", threadId), { status });
}

// Get all threads (one time, admin/staff)
export async function getAllThreads() {
  const q = query(collection(db, "threads"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Thread);
}

// ---- REAL TIME LISTENERS ----

// Listen to all threads in real time (admin/staff inbox)
export function subscribeToAllThreads(callback: (threads: Thread[]) => void) {
  const q = query(collection(db, "threads"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const threads = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Thread,
    );
    callback(threads);
  });
}

// Listen to threads for a specific user in real time (customer)
export function subscribeToThreads(
  userId: string,
  callback: (threads: Thread[]) => void,
) {
  const q = query(
    collection(db, "threads"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snapshot) => {
    const threads = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Thread,
    );
    callback(threads);
  });
}

// Listen to a single thread with replies in real time
export function subscribeToThread(
  threadId: string,
  callback: (thread: (Thread & { replies: Reply[] }) | null) => void,
) {
  const threadRef = doc(db, "threads", threadId);
  const repliesRef = collection(db, "threads", threadId, "replies");
  const repliesQuery = query(repliesRef, orderBy("createdAt", "asc"));

  let currentThread: Thread | null = null;
  let currentReplies: Reply[] = [];

  const threadUnsub = onSnapshot(threadRef, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    currentThread = { id: snap.id, ...snap.data() } as Thread;
    callback({ ...currentThread, replies: currentReplies });
  });

  const repliesUnsub = onSnapshot(repliesQuery, (snap) => {
    currentReplies = snap.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Reply,
    );
    if (currentThread) {
      callback({ ...currentThread, replies: currentReplies });
    }
  });

  // Return combined unsubscribe function
  return () => {
    threadUnsub();
    repliesUnsub();
  };
}
