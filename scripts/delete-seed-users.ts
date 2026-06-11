/**
 * delete-seed-users.ts
 *
 * Deletes all 100 test users created by seed-users.ts
 *
 * Usage: npm run delete-seed
 *
 * Identifies test users by email prefix "testuser" (e.g. testuser1@fake.com)
 * Safe to run multiple times — does nothing if no test users exist.
 *
 * NOTE: Uses FIREBASE_ADMIN_CREDENTIALS_JSON from .env.local
 * The value in .env.local is stored as a multi-line JSON wrapped in single quotes.
 * We read the file directly and extract the JSON by finding { ... } bounds
 * rather than using dotenv, because dotenv cannot handle multi-line values.
 */

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

// ── Load .env.local ──────────────────────────────────────────────────────

// ── Load .env.local ──────────────────────────────────────────────────────
// Cannot use dotenv here — FIREBASE_ADMIN_CREDENTIALS_JSON is multi-line JSON
// wrapped in single quotes which dotenv cannot parse correctly.
// Instead we read the file directly and extract the JSON by { } bounds.

const envContent = readFileSync(".env.local", "utf-8");

const startIndex = envContent.indexOf("FIREBASE_ADMIN_CREDENTIALS_JSON=");
const jsonStart = envContent.indexOf("{", startIndex);
const jsonEnd = envContent.lastIndexOf("}") + 1;
const raw = envContent.slice(jsonStart, jsonEnd);
const credentials = JSON.parse(raw);
if (credentials.private_key && typeof credentials.private_key === "string") {
  credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
}

// ── Init Firebase Admin ──────────────────────────────────────────────────
if (!getApps().length) {
  initializeApp({ credential: cert(credentials) });
}

const db = getFirestore();

async function deleteSeedUsers() {
  console.log("🗑 Deleting test users...");

  const snap = await db
    .collection("users")
    .where("email", ">=", "testuser")
    .where("email", "<=", "testuser\uf8ff")
    .get();

  if (snap.empty) {
    console.log("No test users found.");
    return;
  }

  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  console.log(`✅ Deleted ${snap.docs.length} test users.`);
}

deleteSeedUsers().catch(console.error);
