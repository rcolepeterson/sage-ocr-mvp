# AGENTS.md — Sage Plant Care System

## Typography

- font-heading → Poppins (all headings)
- font-body → Raleway (body text, buttons, labels)
- Never use default Tailwind font classes

## Project Overview

Sage is a mobile-first web app for a plant nursery. Users scan plant
tags via QR code, get personalized plant care plans via LLM, and can
ask experts questions through a threaded conversation interface.
Staff and admins manage threads, notifications, and customer
interactions through a back-office console.

Client: Swansons Nursery
Agency: Herd of Shepherds
Live URL: sage-ocr-mvp-one.vercel.app
Firebase Project: sage-swansons-e4677

---

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Vercel (hosting)
- Google Vision API (OCR, server-side only)
- Vercel AI SDK (Gemini gemini-2.5-flash)
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
/api/flora/route.ts # Flora API plant lookup
/api/notify/route.ts # FCM push notification route
/api/firebase-messaging-sw/route.ts # Service worker route
/scan/page.tsx # Camera + OCR UI + save plant flow
/plant/[spaceId]/[id]/page.tsx # Plant profile page
/plants/page.tsx # My Plants page
/ask/page.tsx # Ask an Expert — thread list + new question
/ask/[threadId]/page.tsx # Thread detail — customer view
/admin/inbox/page.tsx # Staff inbox — split pane desktop, stacked mobile
/admin/dashboard/page.tsx # Admin dashboard — thread queue, staff workload
/signin/page.tsx # Sign in page (all auth methods)
/unauthorized/page.tsx # Unauthorized access page
/terms/page.tsx # T&C acceptance page
/onboarding/page.tsx # Name capture for email/phone users
/debug/page.tsx # Dev tools (admin only)
/page.tsx # Home/Dashboard
/components
/auth
ProtectedRoute.tsx # Guards all authenticated routes
SignOutButton.tsx # Sign out button component
/nav
BottomNav.tsx # Mobile-first bottom nav, role-aware
/ui
Button.tsx # Shared button component
NotificationBanner.tsx # FCM permission banner
/ui/LottieAnimation.tsx # Reusable, SSR-safe Lottie wrapper
/lib
/firebase
config.ts # Firebase initialization + App Check
auth.ts # Firebase Auth instance
firestore.ts # Firestore instance
AuthContext.tsx # Auth state context + provider (includes role)
threads.ts # Thread + reply CRUD + real-time listeners
spaces.ts # Spaces + plants CRUD
storage.ts # Firebase Storage upload/delete
users.ts # User CRUD + role management
messaging.ts # FCM token management
/utils
imageCompression.ts # Client-side image compression before upload
/ocr
index.ts
googleVision.ts
/llm
schema.ts # Zod schema for LLM plant output + tags
/data
plants.json # Seeded plant catalog
/animations/placeholder.json # Lottie animation asset
/onboarding/OnboardingModal.tsx # Onboarding modal logic, Firestore, preview mode

---

## Authentication

- Providers: Google OAuth, Email/Password, Phone (SMS)
- Method: signInWithPopup (Google), signInWithEmailAndPassword, signInWithPhoneNumber
- DO NOT use signInWithRedirect — known issues on localhost
- All routes protected via ProtectedRoute component
- Public routes: /signin, /unauthorized, /terms, /onboarding only
- Auth state + role managed via AuthContext (useAuth hook)
- New users default to "customer" role
- Roles stored in Firestore /users/{uid}

### Sign-In Methods

- Google Sign-In (one tap, Gmail users)
- Email + Password (any email, create account or sign in)
- Phone Number (SMS code, ~$0.01/SMS cost to Swansons)
- Forgot Password (sends reset email via Firebase)

### iPhone Safari Note

- iPhone Safari shows Google passkey screen on sign-in
- Helper text on sign-in page: "Tap Other accounts to sign in with Gmail"
- This is a Google UX issue, not a bug in Sage

### Roles (RBAC)

- customer: view plants, scan tags, ask questions, view threads
- staff: respond to threads, view all threads, mark answered
- admin: manage accounts, routing rules, reporting, oversight, dashboard
- Role stored in /users/{uid}.role
- Change roles manually in Firestore (admin UI planned)

### Auth Flow (Updated)

1. User visits any page
2. ProtectedRoute checks auth state
3. Not signed in → redirect to /signin
4. User chooses sign-in method (Google, Email, Phone)
5. Firebase authenticates
6. AuthContext updates user state + fetches role
7. T&C check → if not accepted → redirect to /terms
8. Onboarding check → if no displayName (email/phone users only) → redirect to /onboarding
9. Redirect to home ✅

### T&C Acceptance

- Stored in Firestore /users/{uid}.termsAcceptedAt (timestamp)
- Stored in Firestore /users/{uid}.termsVersion (string, e.g. "1.0")
- Enforced in ProtectedRoute.tsx after auth check
- /terms page excluded from bottom nav
- Google users also required to accept T&C

### Onboarding

- Captures displayName for email/phone sign-up users
- Google users skipped (name comes from Google profile)
- Saves to Firebase Auth profile via updateProfile()
- Saves to Firestore /users/{uid}.displayName
- Updates AuthContext immediately via setUser
- /onboarding excluded from bottom nav

### Display Name Editing

- Non-Google users can edit their display name in the Account popup
- Google users see name as read-only (managed by Google)
- Uses updateUserDisplayName() from /lib/firebase/users.ts
- Updates both Firebase Auth profile and Firestore

---

## Firestore Structure

/users
/{uid}
uid: string
email: string
displayName: string
role: "customer" | "staff" | "admin"
createdAt: timestamp
termsAcceptedAt: timestamp
termsVersion: string
onboardingCompletedAt?: timestamp
fcmToken?: string
notificationsDeclined?: boolean
specialty?: string

/threads
/{threadId}
plantId?: string
plantName?: string
userId: string
question: string
status: "pending" | "answered" | "needs-followup"
urgent: boolean
assignedTo: string | null
createdAt: timestamp
/replies (subcollection)
/{replyId}
authorId: string
message: string
photoURL?: string
createdAt: timestamp
isStaff: boolean

/users/{uid}/spaces/{spaceId}
name: string
type: "indoor" | "outdoor"
createdAt: timestamp
/plants/{plantId}
commonName: string
latinName: string
photo: string
lightLevel: "low" | "medium" | "high"
container: boolean
indoor: boolean
careInfo: object
tags: string[]
createdAt: timestamp

---

## Firebase Storage

- Bucket: gs://sage-swansons-e4677.firebasestorage.app
- Region: us-west1
- CORS: configured for localhost:3000 and sage-ocr-mvp-one.vercel.app
- Security rules: authenticated users can read/write
- All images compressed before upload via imageCompression.ts
- Max dimensions: 768x768, JPEG quality: 0.4

### Storage Paths

- Thread photos: threads/{threadId}/{timestamp}.jpg
- Plant photos: users/{userId}/plants/{plantId}/{timestamp}.jpg

---

## Firebase App Check

- Provider: reCAPTCHA Enterprise
- Site key: stored in NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY
- Initialized in /lib/firebase/config.ts
- Debug token used for local development (registered in Firebase Console)
- App Check enforced for Authentication in Firebase Console
- phoneEnforcementState set to ENFORCE via Firebase Admin SDK
- Google Cloud project: sage-swansons-e4677
- reCAPTCHA Enterprise key: sage-captcha-key

### Local Development

- FIREBASE_APPCHECK_DEBUG_TOKEN = "0f545190-3605-4320-aa15-f59fd47d1cfa"
- Debug token registered in Firebase Console → App Check → sage-web → Manage debug tokens
- Firebase test phone numbers bypass reCAPTCHA automatically
- Add test numbers in Firebase Console → Authentication → Sign-in method → Phone → Phone numbers for testing

---

## FCM Push Notifications

- Provider: Firebase Cloud Messaging
- Service worker served at /firebase-messaging-sw.js via Next.js rewrite
- FCM token stored in Firestore /users/{uid}.fcmToken
- Permission requested via NotificationBanner component — never automatically
- NotificationBanner shown after customer submits question (/ask)
- NotificationBanner shown at top of staff inbox (/admin/inbox)
- Foreground notifications handled via onMessage in messaging.ts
- Background notifications handled via service worker onBackgroundMessage

### Who Gets Notified

- Staff → when customer creates a new thread (status: pending)
- Staff → when customer replies to a thread (status: needs-followup)
- Customer → when staff replies to their thread

### VAPID Key

- Stored in NEXT_PUBLIC_FIREBASE_VAPID_KEY

---

## Onboarding Modal

- Component: /components/onboarding/OnboardingModal.tsx
- Shows once per user via Firestore flag (onboardingCompletedAt)
- Preview mode: /?onboarding=preview — always shows, never writes to Firestore
- Reset: /debug page → Reset Onboarding button

---

## LottieAnimation Component

- Component: /components/ui/LottieAnimation.tsx
- Usage: <LottieAnimation animationData={json} loop autoplay className="w-36 h-36" />
- Animation JSON files go in /lib/animations/
- Has 'use client' — no dynamic import needed

---

## Ask an Expert

- Customers can ask with or without a plant associated
- /ask has cascading optional dropdowns: space → plant
- If navigated from plant profile (?plantId=&plantName=), dropdowns are hidden
- plantId and plantName are optional on threads

---

## Plant Tagging System

- Tags assigned automatically by Gemini LLM at scan time
- Tags stored in Firestore /users/{uid}/spaces/{spaceId}/plants/{plantId}.tags
- Tags defined in /lib/llm/schema.ts as a Zod enum array
- Multiple tags per category — all applicable tags are assigned
- Tags displayed on plant profile page grouped by category
- Currently staff/admin facing only (labeled "AI Tags — staff/admin testing")

### Tag Categories

- Plant Type (30 values): fruit-tree, rose, tomato, houseplant, etc.
- Light: full-sun-plant, part-shade-plant, full-shade-plant, adaptable-light
- Water: drought-tolerant, moderate-water, high-water, moisture-lover
- Seasonal: spring-bloomer, summer-bloomer, fall-bloomer, etc.
- Care Complexity: beginner-friendly, intermediate-care, expert-care
- Pest & Disease: slug-risk, aphid-risk, powdery-mildew-risk, etc.
- Container: container-friendly, needs-ground-space, raised-bed-ideal, hanging-basket
- PNW Specific: pnw-native, pnw-adapted, rain-tolerant, heat-sensitive, etc.
- Upsell: needs-fertilizer-spring, needs-pruning-tools, needs-mulch, etc.

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
- LLM returns structured lightLevel ("low" | "medium" | "high")
- LLM assigns all applicable tags from the tag list

---

## Threaded Conversation UI

- NOT a chat UI — threaded question-based UI
- Supports text + photo attachments
- Photos compressed before upload, displayed inline
- Photos open in new tab when tapped
- Staff profiles visible in conversation
- Status: pending / answered / needs-followup
- Urgent flag: boolean — set by admin in dashboard
- Customer sees: ⏳ Waiting for expert / ✅ Answered
- Customer reply → auto sets status to needs-followup
- Real-time updates via Firestore onSnapshot listeners
- Staff inbox: split pane on desktop, stacked on mobile

---

## Admin Dashboard

- Route: /admin/dashboard
- Admin only (ProtectedRoute requiredRole="admin")
- Three tabs: Thread Queue, Staff Workload, Send Notifications

### Thread Queue Tab

- Stat cards: Unassigned, Urgent, Open threads, Avg response time
- Thread list: Customer, Plant/Space, Status, Urgent toggle, Waiting time, Assigned to, Assign/Reassign
- Filter pills: All, Unassigned, Urgent, Pending, Needs Followup, Answered
- Filters are client-side, multi-select
- Assign/Reassign opens staff selector dropdown
- Urgent toggle updates urgent field in Firestore in real-time

### Staff Workload Tab

- Lists all staff/admin users with specialty and thread count
- Visual progress bar relative to highest count

### Send Notifications Tab

- Stubbed out — Coming Soon placeholder
- Shows tag filter UI for future targeted notifications

---

## Navigation

- Bottom nav bar (fixed, role-aware)
- Customer: Plants, Scan, Ask, Account
- Staff: Plants, Scan, Inbox, Account
- Admin: Plants, Scan, Inbox, 📊 Dashboard, Account
- Account popup: name, email, sign out, Google profile photo
- Non-Google users: edit name inline in Account popup
- Hidden on /signin, /unauthorized, /terms, /onboarding

---

## Environment Variables

NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sage-swansons-e4677.firebaseapp.com ← keep this, do NOT change to Vercel URL
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY ← reCAPTCHA Enterprise site key for App Check
NEXT_PUBLIC_FIREBASE_VAPID_KEY ← FCM Web Push VAPID key
GOOGLE_APPLICATION_CREDENTIALS_JSON ← VML AI sandbox credentials for Google Vision OCR
FIREBASE_ADMIN_CREDENTIALS_JSON ← sage-swansons-e4677 service account for Firebase Admin SDK
GEMINI_API_KEY
FLORA_API_KEY

---

## Coding Conventions

- Mobile-first UI using Tailwind
- Use App Router patterns only
- Keep OCR calls server-side only
- All LLM responses must follow Zod schema
- Use useAuth() hook for auth state — never read Firebase auth directly
- New routes go under /app
- New components go under /components
- Compress images before upload using compressImage() from /lib/utils/imageCompression.ts
- params in Next.js 15+ are Promises — always unwrap with React.use()

- Lottie animation JSON files go in /lib/animations/
- Font variables must be on <html> for Tailwind v4 compatibility

---

## Do

- Keep secrets in env vars
- Add new routes under /app
- Keep OCR modular (swappable provider)
- Stream LLM output when possible
- Use Tailwind for all styles
- Use useAuth() for auth state
- Compress images before uploading to Firebase Storage
- Unwrap params with React.use() in page components

## Don't

- Use hardcoded Tailwind colour classes (text-green-600, text-gray-500 etc)
  — always use Swansons theme colours:
  text-swansons-green, text-swansons-green-light, text-swansons-green-muted,
  text-swansons-navy, text-swansons-cream, text-swansons-muted
- Call Google Vision from the client
- Hardcode credentials
- Return unstructured LLM output
- Use signInWithRedirect (use signInWithPopup)
- Add business logic to UI components
- Store sensitive data in NEXT*PUBLIC* vars
- Change NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN to the Vercel URL
- Upload uncompressed images to Firebase Storage
- Use GOOGLE_APPLICATION_CREDENTIALS_JSON for Firebase Admin SDK (wrong project)
- Request notification permission automatically — always use user gesture

---

## Key Flows

### Plant Scan Flow

1. User opens /scan
2. Camera captures image
3. Server calls Google Vision (OCR)
4. OCR text returned to UI
5. OCR text sent to LLM route
6. LLM streams structured plant info + assigns tags + structured lightLevel
7. User optionally adds photo (compressed before upload) + selects/creates space
8. Plant saved to Firestore under user's space with tags

### Auth Flow

1. User visits any page
2. ProtectedRoute checks auth state
3. Not signed in → redirect to /signin
4. User chooses sign-in method (Google, Email, Phone)
5. Firebase authenticates
6. AuthContext updates user state + fetches role
7. T&C check → if not accepted → redirect to /terms
8. Onboarding check → if no displayName → redirect to /onboarding
9. Redirect to home ✅

### Thread Flow

1. Customer asks question (optionally linked to a plant)
2. Thread created in Firestore (status: pending)
3. Staff notified via FCM push notification
4. Staff sees thread in inbox in real-time
5. Staff replies (text or photo)
6. Customer notified via FCM push notification
7. Customer sees reply in real-time
8. Customer reply → auto sets needs-followup
9. Staff notified via FCM
10. Staff marks answered ✅

### Admin Thread Management Flow

1. Admin views dashboard → Thread Queue tab
2. Filters threads by status/urgent/unassigned
3. Assigns thread to staff member
4. Toggles urgent flag if needed
5. Monitors staff workload via Staff Workload tab

---

## Commands

npm install # Install dependencies
npm run dev # Start local dev server
npm run build # Build for production
npx vercel --prod # Deploy to Vercel

---

## Planned 🔲

### High Priority

- Admin user management (change roles in app)
- QR code → direct URL sign in
- Update plant photo after saving
- Email notifications

### Medium Priority

- Staff profiles in replies
- Internal notes (staff only)
- Canned responses/macros
- Routing rules
- Dashboard/Home (waiting on Shawn's designs)
- Account/Profile page (edit name, view details)
- Send Notifications — targeted push by plant tags
- Apple Developer account ($99/yr) for iPhone push + Sign in with Apple

### Lower Priority

- Reporting & system health
- Audit log
- Search & Export
- SMS notifications via Twilio

---

## Google Cloud Projects

One active project:

| Project Name  | Project ID          | Purpose                                                            |
| ------------- | ------------------- | ------------------------------------------------------------------ |
| sage-swansons | sage-swansons-e4677 | Firebase project — ALL app data, Auth, Firestore, Storage, billing |

The duplicate sage-swansons project (ID: sage-swansons) was deleted April 2026.

**Always use sage-swansons-e4677 for Firebase, App Check, and Admin SDK work.**

### Service Accounts

- `GOOGLE_APPLICATION_CREDENTIALS_JSON` — VML AI sandbox project (`ai-sandbox-d-vml-ai-env-283d`) — used for Google Vision OCR only
- `FIREBASE_ADMIN_CREDENTIALS_JSON` — sage-swansons-e4677 project — used for Firebase Admin SDK

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
