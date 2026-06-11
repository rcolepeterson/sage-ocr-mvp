import * as admin from "firebase-admin";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

// ── Load .env.local ──────────────────────────────────────────────────────
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

// ── Fake data ────────────────────────────────────────────────────────────
const NAMES = [
  "Alice Johnson",
  "Bob Smith",
  "Carol White",
  "David Brown",
  "Emma Davis",
  "Frank Miller",
  "Grace Wilson",
  "Henry Moore",
  "Isabella Taylor",
  "James Anderson",
  "Karen Thomas",
  "Liam Jackson",
  "Mia Harris",
  "Noah Martin",
  "Olivia Garcia",
  "Paul Martinez",
  "Quinn Robinson",
  "Rachel Clark",
  "Sam Rodriguez",
  "Tina Lewis",
];

const PLANT_TAGS = [
  "hosta",
  "rose",
  "tomato",
  "succulent",
  "houseplant",
  "lavender",
  "hydrangea",
  "fern",
  "herb",
  "berry-bush",
  "fruit-tree",
  "rhododendron",
  "full-sun-plant",
  "part-shade-plant",
  "full-shade-plant",
  "drought-tolerant",
  "moderate-water",
  "high-water",
  "beginner-friendly",
  "intermediate-care",
  "pnw-native",
  "pnw-adapted",
  "rain-tolerant",
  "needs-fertilizer-spring",
  "needs-mulch",
  "container-friendly",
  "spring-bloomer",
  "summer-bloomer",
  "evergreen",
  "deciduous",
];

function randomFrom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ── Seed 100 users ───────────────────────────────────────────────────────
async function seedUsers() {
  console.log("🌱 Seeding 100 test users...");

  const batch = db.batch();

  for (let i = 1; i <= 100; i++) {
    const uid = `test_user_${String(i).padStart(3, "0")}`;
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const tagCount = Math.floor(Math.random() * 4) + 3;
    const plantTags = randomFrom(PLANT_TAGS, tagCount);

    const userRef = db.collection("users").doc(uid);
    batch.set(userRef, {
      uid,
      displayName: name,
      email: `testuser${i}@fake.com`,
      role: "customer",
      plantTags,
      createdAt: new Date(),
      termsAcceptedAt: new Date(),
      termsVersion: "1.0",
    });

    if (i % 20 === 0) console.log(`  ✓ ${i}/100 users prepared`);
  }

  await batch.commit();
  console.log("✅ 100 test users seeded successfully!");
  console.log("   Run 'npm run delete-seed' to remove them when done.");
}

seedUsers().catch(console.error);
