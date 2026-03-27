# AGENTS.md — Sage Plant Care System

## Project Overview

Sage is a mobile-first web app for a plant nursery. Users scan plant
tags via QR code, get personalized plant care plans via LLM, and can
ask experts questions through a threaded conversation interface.
Staff and admins manage threads, notifications, and customer
interactions through a back-office console.

---

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Vercel (hosting)
- Google Vision API (OCR, server-side only)
- Vercel AI SDK (Gemini gemini-2.5-flash)
- Firebase Auth (Google Sign-In via signInWithPopup)
- Firestore (database)
- Firebase Cloud Messaging (FCM, notifications)
- Firebase Storage (images/media)

---

## Directory Structure

/app
/api/ocr/route.ts # OCR server route (Google Vision)
/api/plant-llm/route.ts # LLM streaming route
/api/flora/route.ts # Flora API plant lookup
/scan/page.tsx # Camera + OCR UI
/plant/[id]/page.tsx # Plant profile page
/signin/page.tsx # Sign in page (Firebase Auth)
/page.tsx # Home/Dashboard
/components
/auth
ProtectedRoute.tsx # Guards all authenticated routes
SignOutButton.tsx # Sign out button component
/ui
Button.tsx # Shared button component
/lib
/firebase
config.ts # Firebase initialization
auth.ts # Firebase Auth instance
firestore.ts # Firestore instance
AuthContext.tsx # Auth state context + provider
/ocr
index.ts
googleVision.ts
/llm
schema.ts # Zod schema for LLM plant output
/data
plants.json # Seeded plant catalog
/docs # Product docs (optional)

---

## Authentication

- Provider: Firebase Auth
- Method: signInWithPopup (Google)
- DO NOT use signInWithRedirect — known issues on localhost
- All routes protected via ProtectedRoute component
- Public routes: /signin only
- Auth state managed via AuthContext (useAuth hook)

### Roles (RBAC — to be implemented)

- customer: view plants, scan tags, ask questions, view threads
- staff: respond to threads, use macros, request reassignment
- admin: manage accounts, routing rules, reporting, oversight

---

## Firestore Structure

/threads
/{threadId}
plantId: string
userId: string
question: string
status: "pending" | "answered" | "needs-followup"
createdAt: timestamp
/replies (subcollection)
/{replyId}
authorId: string
message: string
createdAt: timestamp
isStaff: boolean

---

## Users

Two types:

1. Customers — public users scanning plant tags
2. Staff/Admin — nursery employees managing threads and content

---

## LLM Streaming

- Frontend: useCompletion from @ai-sdk/react
- streamProtocol: "text" is required
- Partial JSON parsed with parsePartialJson(completion)
- Route uses streamObject → toTextStreamResponse()
- Model: gemini-2.5-flash
- All LLM responses must follow Zod schema in /lib/llm/schema.ts

---

## Threaded Conversation UI

- NOT a chat UI — threaded question-based UI
- Supports text, photos, links
- Staff profiles visible in conversation
- Status: waiting / answered / needs follow-up
- Realistic for async staff response times

---

## Notifications

- Firebase Cloud Messaging (FCM) — free push notifications
- Browser must be running in background to receive
- Used for: staff reply alerts, plant care reminders

---

## Environment Variables

NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
GOOGLE_APPLICATION_CREDENTIALS_JSON
GEMINI_API_KEY
FLORA_API_KEY

---

## Coding Conventions

- Mobile-first UI using Tailwind
- Use App Router patterns only
- Keep OCR calls server-side only
- Use App Router patterns
- All LLM responses must follow Zod schema
- Use useAuth() hook for auth state — never read Firebase auth directly
- New routes go under /app
- New components go under /components

---

## Do

- Keep secrets in env vars
- Add new routes under /app
- Keep OCR modular (swappable provider)
- Stream LLM output when possible
- Use Tailwind for all styles
- Use useAuth() for auth state

## Don't

- Call Google Vision from the client
- Hardcode credentials
- Return unstructured LLM output
- Use signInWithRedirect (use signInWithPopup)
- Add business logic to UI components
- Store sensitive data in NEXT*PUBLIC* vars

---

## Key Flows

### Plant Scan Flow

1. User opens /scan
2. Camera captures image
3. Server calls Google Vision (OCR)
4. OCR text returned to UI
5. OCR text sent to LLM route
6. LLM streams structured plant info

### Auth Flow

1. User visits any page
2. ProtectedRoute checks auth state
3. Not signed in → redirect to /signin
4. User clicks Sign in with Google → signInWithPopup
5. Firebase authenticates
6. AuthContext updates user state
7. Redirect to home ✅

---

## Commands

npm install # Install dependencies
npm run dev # Start local dev server
npm run build # Build for production
npx vercel --prod # Deploy to Vercel

---

## Implemented

- Home page (/)
- Scan page (/scan): camera, OCR, matching
- OCR via Google Vision (server-side)
- Seeded plant catalog
- Plant profile page (/plant/[id])
- LLM plant info lookup (Gemini, streaming)
- Firebase Auth (Google Sign-In via popup)
- Firebase Config
- Firestore connected
- Protected Routes
- Sign In page (/signin)
- Deployed: sage-ocr-mvp-one.vercel.app

## Planned

- Firestore threaded conversations
- Ask-an-expert threaded UI
- Admin/staff console
- Role-based access control (RBAC)
- Firebase Storage (plant + thread images)
- Firebase Cloud Messaging (notifications)
- Apple Sign-In
- Email + Password Sign-In

---

<!-- VERCEL BEST PRACTICES START -->

## Vercel Best Practices

- Treat Vercel Functions as stateless + ephemeral
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (discontinued)
- Store secrets in Vercel Env Variables; not in git or NEXT*PUBLIC*\*
- Use waitUntil for post-response work
- Set Function regions near your primary data source
- Use Runtime Cache for fast regional caching
- Use Cron Jobs for schedules (runs UTC, triggers production URL)
- Use Vercel Blob for uploads/media
- Use Edge Config for small globally-read config
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing with AI_GATEWAY_API_KEY
<!-- VERCEL BEST PRACTICES END -->
