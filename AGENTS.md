Sage OCR MVP — Agent Guide
Project Overview
Sage is a web-based plant care system for Swansons Nursery. The MVP
enables users to scan plant tags, extract text via OCR, and stream
structured plant info from an LLM.

Client: Swansons Nursery
Agency: Herd of Shepherds
Developer: Cole Peterson
Contract Start: March 25, 2026
Contract End: August 31, 2026

MVP Scope

Implemented:

- Home page (/)
- Scan page (/scan): camera, OCR, matching
- OCR via Google Vision (server-side)
- Seeded plant catalog
- Plant profile page (/plant/[id])
- LLM plant info lookup (Gemini, streaming)
- Firebase Auth (Google Sign-In) ✅
- Firebase Config ✅
- Firestore connected ✅

Planned/In Scope:

- Firebase Authentication (OAuth)
- Firestore threaded conversations
- Reminders/notifications (FCM)
- Ask-an-expert chat (threaded UI)
- Admin/staff tools
- Role-based access control (RBAC)

Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Vercel hosting
- Google Vision API
- Vercel AI SDK (Gemini)
- Firebase Auth (OAuth)
- Firestore (database)
- Firebase Cloud Messaging (FCM)

Users
Two types of users:

1. Customers (public) — e.g. grandma scanning a plant tag
2. Staff/Admin — Swansons nursery employees

Authentication Strategy

- Firebase OAuth (passwordless)
- Sign in with Google (Gmail users)
- Sign in with Microsoft (Outlook/365 users)
- Sign in with Apple (Apple ID users)
- Email + Password (fallback for everyone else)
- Phone/SMS sign-in (optional, costs ~$0.01/SMS, Swansons pays)
- Magic links: NOT supported (deprecated by Firebase Aug 2025)
- FirebaseUI recommended as drop-in auth solution

Roles (RBAC)

- Customer: view plants, scan tags, ask questions, view threads
- Expert/Staff: respond to threads, use macros, request reassignment
- Admin: manage staff accounts, routing rules, reporting, oversight

Database: Firestore Structure
/threads
/{threadId}
plantId: string
userId: string
question: string
status: "pending" | "answered" | "needs-followup"
createdAt: timestamp
/replies
/{replyId}
authorId: string
message: string
createdAt: timestamp
isStaff: boolean

Threaded Conversation UI

- NOT a chat UI — threaded question-based UI
- Realistic for staff response times
- Supports text, photos, links
- Staff profiles visible in conversation
- Status: waiting / answered / needs follow-up

Notifications

- Firebase Cloud Messaging (FCM) — free
- Push notifications (browser must be running in background)
- Email notifications (free fallback)
- SMS via Twilio (optional, ~$0.008/SMS + $1/month for number)
- Plant care reminders (watering, fertilizing, seasonal)
- Staff alerts for new customer threads

Infrastructure

- GCP account: owned by Herd of Shepherds (agency)
- Firebase project: set up by agency
- Vercel: set up by agency
- Developer (Cole) gets admin access
- Hosting costs: $50-$200/month (not included in contract, paid by client)

Local Dev Environment

- Machine: VML Mac (company managed, OneDrive synced)
- Dev folder: ~/Dev/2026/
- Repo: ~/Dev/2026/sage-ocr-mvp
- Documents folder is OneDrive synced — keep all dev work in ~/Dev

Environment Variables

- GOOGLE_APPLICATION_CREDENTIALS_JSON: Google Vision service account
- GEMINI_API_KEY: Gemini LLM API key
- FLORA_API_KEY: Flora API plant lookup
- FIREBASE_API_KEY: Firebase config (to be added)
- FIREBASE_AUTH_DOMAIN: Firebase config (to be added)

Directory Map
/app
/api/ocr/route.ts # OCR server route
/api/plant-llm/route.ts # LLM streaming route (implemented)
/api/flora/route.ts # Flora API lookup route
/scan/page.tsx # Camera + OCR UI
/plant/[id]/page.tsx # Plant profile page
/page.tsx # Home
/data
plants.json # Seeded plant catalog
/lib
/ocr/index.ts
/ocr/googleVision.ts
/llm/schema.ts # Zod schema for plant output
/docs # Product docs

LLM Streaming Details

- Frontend uses useCompletion from @ai-sdk/react
- streamProtocol: "text" is required
- Partial JSON parsed with parsePartialJson(completion)
- LLM route uses streamObject → toTextStreamResponse()
- Model: gemini-2.5-flash (stable)

Coding Conventions

- Keep OCR calls server-side only
- Use Tailwind for UI styles
- UI must be clean and mobile-first
- Use App Router patterns
- LLM responses must follow schema

Do / Don't
Do:

- Keep secrets in env vars
- Add new routes under /app
- Keep OCR modular (swappable provider)
- Stream LLM output when possible

Don't:

- Call Google Vision from the client
- Hardcode credentials
- Return unstructured LLM output

Key Flow (MVP POC)

1. User opens /scan
2. Camera captures image
3. Server calls Google Vision
4. OCR text returned to UI
5. OCR text sent to LLM route
6. LLM streams structured plant info (schema)

Commands
npm install # Install dependencies
npm run dev # Start local dev server
npm run build # Build for production
vercel --prod # Deploy to Vercel

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->
