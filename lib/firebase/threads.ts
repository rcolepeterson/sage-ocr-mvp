/* eslint-disable @typescript-eslint/no-explicit-any */
// /lib/firebase/threads.ts
import {
  collection,
  deleteField,
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
import { getStaffFcmTokens, getUserFcmToken } from "./users";

// ---------------------------------------------------------------------------
// Notification helpers (best-effort, fire-and-forget)
// ---------------------------------------------------------------------------

async function sendNotification(
  token: string,
  title: string,
  body: string,
): Promise<void> {
  console.log("[notify] sending to token:", token.slice(0, 20) + "...", {
    title,
    body,
  });
  const res = await fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, title, body }),
  });
  const data = await res.json();
  console.log("[notify] response:", res.status, data);
}

async function notifyStaff(title: string, body: string): Promise<void> {
  console.log("[notify] fetching staff FCM tokens...");
  const tokens = await getStaffFcmTokens();
  console.log(
    "[notify] staff tokens found:",
    tokens.length,
    tokens.map((t) => t.slice(0, 20) + "..."),
  );
  if (tokens.length === 0) {
    console.warn(
      "[notify] no staff tokens — nobody will be notified. Have staff users enabled notifications?",
    );
  }
  await Promise.allSettled(
    tokens.map((token) => sendNotification(token, title, body)),
  );
}

async function notifyThreadOwner(
  threadId: string,
  title: string,
  body: string,
): Promise<void> {
  console.log("[notify] fetching thread owner token for thread:", threadId);
  const threadSnap = await getDoc(doc(db, "threads", threadId));
  if (!threadSnap.exists()) {
    console.warn("[notify] thread not found:", threadId);
    return;
  }
  const userId = threadSnap.data().userId as string;
  console.log("[notify] thread owner uid:", userId);
  const token = await getUserFcmToken(userId);
  if (token) {
    console.log("[notify] customer token found, sending...");
    await sendNotification(token, title, body);
  } else {
    console.warn(
      "[notify] no FCM token for customer uid:",
      userId,
      "— have they enabled notifications?",
    );
  }
}

export type ThreadStatus =
  | "new"
  | "assigned"
  | "waiting-on-customer"
  | "needs-followup"
  | "closed";

export interface Thread {
  id: string;
  plantId: string;
  plantName: string;
  userId: string;
  question: string;
  status: ThreadStatus;
  createdAt: any;
  lastActivityAt?: any;
  assignedTo?: string | null;
  urgent?: boolean;
}

export interface Reply {
  id: string;
  authorId: string;
  message: string;
  createdAt: any;
  isStaff: boolean;
  photoURL?: string;
}

// Create a new thread
export async function createThread(
  plantId: string,
  userId: string,
  question: string,
  plantName: string = "",
) {
  const threadRef = await addDoc(collection(db, "threads"), {
    plantId,
    plantName,
    userId,
    question,
    status: "new",
    createdAt: serverTimestamp(),
    assignedTo: null,
    urgent: false,
  });
  // TODO: re-enable when notifications are ready to ship
  // notifyStaff(
  //   "New question",
  //   "A customer has a new plant care question.",
  // ).catch(console.error);
  return threadRef.id;
}

// Update thread assignment
export async function updateThreadAssignment(
  threadId: string,
  staffUid: string | null,
) {
  if (staffUid) {
    // Assign — set assignedTo and move status to "assigned"
    await updateDoc(doc(db, "threads", threadId), {
      assignedTo: staffUid,
      status: "assigned",
    });
  } else {
    // ✅ Unassign — properly remove the field AND reset status
    await updateDoc(doc(db, "threads", threadId), {
      assignedTo: deleteField(),
      status: "new",
    });
  }
}

// Update thread urgent flag
export async function updateThreadUrgent(threadId: string, urgent: boolean) {
  await updateDoc(doc(db, "threads", threadId), { urgent });
}

// Real-time listener for all threads (admin)
export function subscribeToAllThreadsAdmin(
  onUpdate: (threads: Thread[]) => void,
) {
  return onSnapshot(
    query(collection(db, "threads"), orderBy("createdAt", "desc")),
    (snapshot) => {
      const threads = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Thread,
      );
      onUpdate(threads);
    },
  );
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
  photoURL?: string,
  skipStatusUpdate: boolean = false,
) {
  const replyRef = await addDoc(
    collection(db, "threads", threadId, "replies"),
    {
      authorId,
      message,
      isStaff,
      createdAt: serverTimestamp(),
      ...(photoURL ? { photoURL } : {}),
    },
  );
  if (!skipStatusUpdate) {
    await updateDoc(doc(db, "threads", threadId), {
      status: isStaff ? "waiting-on-customer" : "needs-followup",
      lastActivityAt: serverTimestamp(),
    });
  }
  // TODO: re-enable when notifications are ready to ship
  // if (isStaff) {
  //   notifyThreadOwner(
  //     threadId,
  //     "Expert reply",
  //     "A Swansons expert replied to your plant question.",
  //   ).catch(console.error);
  // } else {
  //   notifyStaff(
  //     "Follow-up question",
  //     "A customer replied and needs further help.",
  //   ).catch(console.error);
  // }
  return replyRef.id;
}

// Update thread status
export async function updateThreadStatus(
  threadId: string,
  status: ThreadStatus,
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

  return () => {
    threadUnsub();
    repliesUnsub();
  };
}
