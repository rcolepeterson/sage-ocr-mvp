# AGENTS.md — Sage Plant Care System

## Project Overview

Sage is a mobile-first web app for a plant nursery. Users scan plant tags via QR code, get personalized plant care plans via LLM, and can ask experts questions through a threaded conversation interface. Staff and admins manage threads, notifications, and customer interactions through a back-office console.

Client: Swansons Nursery
Agency: Herd of Shepherds
Live URL: sage-ocr-mvp-one.vercel.app
Firebase Project: sage-swansons-e4677

---

## Debug & Preview Flags

- **Onboarding Modal Preview:** Add `?onboarding=preview` to any URL to force the onboarding modal or name form to show for design/testing. No data is saved in preview mode.
- **Dev Mode:** The app uses `process.env.NODE_ENV === "development"` for local/dev-only logic (see `/lib/firebase/config.ts`).
- **Debug Tools:** Visit `/debug` for admin-only dev/debug tools (reset onboarding, test email, etc).

---

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Vercel (hosting)
- Google Vision API (OCR, server-side only)
- Vercel AI SDK + Vertex AI (Gemini gemini-2.5-flash)
- Firebase Auth (Google, Email/Password, Phone)
- Firebase App Check (reCAPTCHA Enterprise)
- Firestore (database)
- Firebase Storage (images/media)
- Firebase Cloud Messaging (FCM, notifications)
- lottie-react (Lottie animations)

---

## Directory Structure

/app
/api/ocr/route.ts # OCR server route (Google Vision)
/api/plant-llm/route.ts # LLM streaming route

/api/notify/route.ts # FCM push notification route
/api/firebase-messaging-sw/route.ts # Service worker route
/scan/page.tsx # Camera + OCR UI + save plant flow
/plant/[spaceId]/[id]/page.tsx # Plant profile page
/plant/[spaceId]/[id]/move/page.tsx # Move plant to different space
/spaces/page.tsx # My Spaces page
/ask/page.tsx # Ask an Expert — thread list + new question
/ask/[threadId]/page.tsx # Thread detail — customer view
/admin/inbox/page.tsx # Staff inbox
/admin/dashboard/page.tsx # Admin dashboard
/signin/page.tsx # Sign in page (all auth methods)
/unauthorized/page.tsx # Unauthorized access page
/terms/page.tsx # T&C acceptance page
/onboarding/page.tsx # Name capture for email/phone users
/debug/page.tsx # Dev tools (admin only)
/page.tsx # Home/Dashboard

/components
/auth/ProtectedRoute.tsx # Guards all authenticated routes
/nav/HamburgerMenu.tsx # Slide-out nav menu with role-aware links
/nav/BackButton.tsx # Back navigation button
/onboarding/OnboardingModal.tsx # Onboarding modal, Firestore, preview mode
/ui/Button.tsx # Shared button (primary, secondary, text, disabled, inverted)
/ui/NotificationBanner.tsx # FCM permission banner
/ui/LottieAnimation.tsx # Reusable, SSR-safe Lottie wrapper
/ui/PhotoPicker.tsx # Photo picker with action sheet
/ui/EditIcon.tsx # Edit pencil icon component
/ui/Logo.tsx # Sage by Swansons logo component
ClientLayout.tsx # Conditional max-width, padding, botanical bg
ScrollToTop.tsx # Scrolls to top on route change

/lib
/firebase/config.ts # Firebase initialization + App Check
/firebase/auth.ts # Firebase Auth instance
/firebase/firestore.ts # Firestore instance
/firebase/AuthContext.tsx # Auth state context + provider (includes role)
/firebase/threads.ts # Thread + reply CRUD + real-time listeners
/firebase/spaces.ts # Spaces + plants CRUD + movePlantToSpace
/firebase/storage.ts # Firebase Storage upload/delete
/firebase/users.ts # User CRUD + role management
/firebase/messaging.ts # FCM token management
/hooks/useSpaces.ts # Spaces + plant counts + latest plant hook
/utils/imageCompression.ts # Image compression (512x512, q0.3)
/ocr/googleVision.ts
/llm/schema.ts # Zod schema for LLM plant output + tags
/animations/placeholder.json # Lottie animation asset

/public/images # Logo, botanical illustrations, icons

---

## Authentication

- Providers: Google OAuth, Email/Password, Phone (SMS)
- DO NOT use signInWithRedirect — known issues on localhost
- All routes protected via ProtectedRoute component
- Public routes: /signin, /unauthorized, /terms, /onboarding only
- Auth state + role managed via AuthContext (useAuth hook)
- New users default to "customer" role
- Roles: customer | staff | admin — stored in Firestore /users/{uid}.role

### Auth Flow

1. ProtectedRoute checks auth state → redirect to /signin if not authenticated
2. Firebase authenticates
3. AuthContext updates user state + fetches role
4. T&C check → /terms if not accepted
5. Onboarding check → /onboarding if no displayName (email/phone users only)
6. Redirect to home ✅

### iPhone Safari Note

iPhone Safari shows Google passkey screen on sign-in. Helper text: "Tap Other accounts to sign in with Gmail". This is a Google UX issue, not a bug.

---

## Firestore Structure

/users/{uid} uid, email, displayName: string role: "customer" | "staff" | "admin" createdAt, termsAcceptedAt: timestamp termsVersion: string onboardingCompletedAt?: timestamp fcmToken?: string notificationsDeclined?: boolean specialty?: string plantTags?: string[]

/threads/{threadId} plantId?: string plantName?: string userId: string question: string status: "pending" | "answered" | "needs-followup" urgent: boolean assignedTo: string | null createdAt: timestamp /replies/{replyId} authorId, message: string photoURL?: string isStaff: boolean createdAt: timestamp

/users/{uid}/spaces/{spaceId} name: string type: "indoor" | "outdoor" createdAt: timestamp /plants/{plantId} commonName, latinName, photo: string lightLevel: "low" | "medium" | "high" container, indoor: boolean careInfo: object tags: string[] createdAt: timestamp

---

## Firebase Storage

- Bucket: gs://sage-swansons-e4677.firebasestorage.app
- Region: us-west1
- All images compressed before upload (max 512x512, JPEG quality 0.3)
- Thread photos: threads/{threadId}/{timestamp}.jpg
- Plant photos: users/{userId}/plants/{plantId}/{timestamp}.jpg

---

## Firebase App Check

- Provider: reCAPTCHA Enterprise
- FIREBASE_APPCHECK_DEBUG_TOKEN = "0f545190-3605-4320-aa15-f59fd47d1cfa" (local dev only)
- phoneEnforcementState: ENFORCE

---

## FCM Push Notifications

- Permission requested via user gesture only — never automatically
- Staff notified on new thread + customer reply
- Customer notified on staff reply
- Service worker at /firebase-messaging-sw.js
- VAPID key stored in NEXT_PUBLIC_FIREBASE_VAPID_KEY

---

## Key Components

### PhotoPicker

- Component: /components/ui/PhotoPicker.tsx
- Shows action sheet: "Take Photo" / "Choose from Library"
- Props: onFile: (file: File) => void, disabled?: boolean, children: ReactNode
- Use for ALL photo uploads — never raw input[type=file]

### LottieAnimation

- Component: /components/ui/LottieAnimation.tsx
- Animation JSON files go in /lib/animations/
- Has 'use client' — no dynamic import needed

### OnboardingModal

- Component: /components/onboarding/OnboardingModal.tsx
- Shows once per user via Firestore flag (onboardingCompletedAt)
- Preview: /?onboarding=preview

### Button

- Variants: primary | secondary | text | disabled | inverted
- All sizes include max-w-[260px] by default

---

## LLM

- Model: gemini-2.5-flash via Vercel AI SDK
- streamProtocol: "text" — useCompletion from @ai-sdk/react
- All responses must follow Zod schema in /lib/llm/schema.ts
- Tags assigned across 9 categories at scan time

---

## AI Plant Tagging System

Tags are automatically assigned by Gemini at scan time and stored on each plant document.

### Where tags live

Firestore: `/users/{uid}/spaces/{spaceId}/plants/{plantId}.tags` — string array

### When tags are assigned

During the scan flow — the LLM receives the OCR text, identifies the plant, and assigns all applicable tags from the predefined list in `/lib/llm/schema.ts`.

### Tag categories (9 total)

Plant Type, Light, Water, Seasonal, Care Complexity, Pest & Disease, Container, PNW Specific, Upsell

### Current usage

- Displayed on plant profile page — staff/admin only (labeled "AI Tags — staff/admin")
- Customers do not see tags yet

### Planned usage

- Filter plants/spaces by tag
- Send targeted push notifications by tag (e.g. notify all hosta owners in spring)

### Where the tag list lives

`/lib/llm/schema.ts` — Zod enum array. The LLM prompt in `/app/api/plant-llm/route.ts` passes the full tag list and instructs Gemini to assign all applicable tags.

---

## Environment Variables

NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sage-swansons-e4677.firebaseapp.com ← do NOT change to Vercel URL
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY
NEXT_PUBLIC_FIREBASE_VAPID_KEY
GOOGLE_APPLICATION_CREDENTIALS_JSON ← sage-swansons-e4677 service account — OCR + Vertex AI LLM
FIREBASE_ADMIN_CREDENTIALS_JSON ← sage-swansons-e4677 — Firebase Admin SDK only

---

## Commands

npm run dev # Start local dev server npm run build # Build for production npx vercel --prod # Deploy to Vercel

---

## Google Cloud Projects

One active project: **sage-swansons-e4677**

- All Firebase, App Check, Admin SDK, OCR and Vertex AI LLM use this project
- GOOGLE_APPLICATION_CREDENTIALS_JSON → sage-swansons-e4677 service account — powers OCR + Vertex AI LLM
- FIREBASE_ADMIN_CREDENTIALS_JSON → sage-swansons-e4677 — Firebase Admin SDK only

---

<!-- VERCEL BEST PRACTICES START -->

## Vercel Best Practices

- Treat Vercel Functions as stateless + ephemeral
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Store secrets in Vercel Env Variables — not in git or NEXT*PUBLIC*\*
- Use waitUntil for post-response work
- Use Cron Jobs for schedules (runs UTC, triggers production URL)
- Enable Web Analytics + Speed Insights early
<!-- VERCEL BEST PRACTICES END -->
