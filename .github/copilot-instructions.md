# Copilot Instructions — Sage Plant Care System

This file provides GitHub Copilot with project-specific context. For the full reference, see `AGENTS.md` at the repo root.

---

## Project

Sage is a mobile-first Next.js (App Router) web app for Swansons Nursery. Users scan plant tags, get AI-generated care plans, and ask nursery experts questions. Staff and admins manage threads via a back-office console.

- **Live URL:** sage-ocr-mvp-one.vercel.app
- **Firebase project:** sage-swansons-e4677

---

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- Firebase Auth, Firestore, Storage, FCM, App Check
- Google Vision API (OCR — server-side only)
- Vercel AI SDK + Gemini gemini-2.5-flash (streaming LLM)
- Vercel (hosting)

---

## Typography

- `font-heading` → Poppins (all headings)
- `font-body` → Raleway (body text, buttons, labels)
- Never use default Tailwind font classes

---

## Colour — Always use theme tokens, never raw Tailwind colours

| Token                       | Usage                |
| --------------------------- | -------------------- |
| `text-swansons-green`       | Primary green        |
| `text-swansons-green-light` | Light green          |
| `text-swansons-green-muted` | Muted green          |
| `text-swansons-navy`        | Navy / headings      |
| `text-swansons-cream`       | Background cream     |
| `text-swansons-muted`       | Secondary text       |
| `text-swansons-green-dark`  | Dark green           |
| `text-swansons-black`       | Black text (#020202) |

---

## Key Conventions

- **Mobile-first** UI with Tailwind
- **App Router only** — all routes under `/app`
- **`useAuth()`** for auth state — never read Firebase auth directly
- **`React.use()`** to unwrap `params` in page components (Next.js 15+)
- **`compressImage()`** from `/lib/utils/imageCompression.ts` before every upload
- **`PhotoPicker`** from `@/components/ui/PhotoPicker` for all photo uploads — never use raw `<input type="file">`
- **OCR stays server-side** — never call Google Vision from the client
- **LLM output must follow** the Zod schema in `/lib/llm/schema.ts`
- **`signInWithPopup`** only — never `signInWithRedirect`
- **Never store sensitive data** in `NEXT_PUBLIC_*` env vars
- **Always use** `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sage-swansons-e4677.firebaseapp.com` — do not change to Vercel URL
- **`useSearchParams()`** must be inside a `<Suspense>` boundary

---

## Directory Structure (key paths)

```
/app                          # All routes (App Router)
  /api/ocr/route.ts           # OCR (Google Vision, server-side only)
  /api/plant-llm/route.ts     # LLM streaming
  /scan/page.tsx              # Camera + OCR + save plant flow
  /plant/[spaceId]/[id]/      # Plant profile
  /spaces/page.tsx            # My Spaces
  /ask/page.tsx               # Ask an Expert
  /ask/[threadId]/page.tsx    # Thread detail
  /admin/inbox/page.tsx       # Staff inbox
  /admin/dashboard/page.tsx   # Admin dashboard
/components
  /auth/ProtectedRoute.tsx
  /nav/BottomNav.tsx
  /ui/PhotoPicker.tsx         # Use for ALL photo uploads
  /ui/Button.tsx
/lib/firebase/                # Firebase SDK wrappers
/lib/llm/schema.ts            # Zod schema for LLM output
/lib/utils/imageCompression.ts
```

---

## Auth & Roles

- Roles: `customer` | `staff` | `admin` — stored in Firestore `/users/{uid}.role`
- All routes protected via `ProtectedRoute`
- Public routes: `/signin`, `/unauthorized`, `/terms`, `/onboarding`
- T&C and onboarding checks run in `ProtectedRoute` after auth

---

## Do Not

- Use hardcoded Tailwind colour classes (`text-green-600`, `text-gray-500`, etc.)
- Call Google Vision from the client
- Return unstructured LLM output
- Use `signInWithRedirect`
- Add business logic to UI components
- Upload uncompressed images
- Use `GOOGLE_APPLICATION_CREDENTIALS_JSON` for Firebase Admin SDK (wrong project)
- Request notification permission automatically — always require a user gesture
- Use raw `<input type="file">` for photos — always use `PhotoPicker`

## Error Handling

- Never fail silently — always show the user a friendly error message
- Use the ErrorBanner component pattern for inline errors (red pill, dismissible)
- Camera errors get their own dedicated state (cameraError) separate from general errors
- Error messages should be friendly and actionable — tell the user what to do next
- Always clear errors (setError(null)) at the start of a new action

## Scrolling

- Lenis smooth scroll is installed — any scrollable panel needs `data-lenis-prevent` attribute
- Without it, Lenis intercepts scroll events and prevents native CSS overflow scrolling
