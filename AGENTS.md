# AGENTS.md

This file describes project context and key flows for the Sage OCR MVP web app.

## Project Overview

Sage is a web-based plant care system for Swansons Nursery. This MVP focuses on a scan-to-OCR flow that reads plant tag text.

## Current MVP Scope

**Implemented:**

- Home page with link to `/scan`
- `/scan` camera page
- OCR via Google Vision (server-side API route)
- Seeded plant catalog and matching flow
- `/plant/[id]` profile page

**Not yet implemented:**

- Reminders / notifications
- Ask-an-expert chat
- Admin/staff tools

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Vercel hosting
- Google Vision API

## Environment Variables

Required for OCR:

- `GOOGLE_APPLICATION_CREDENTIALS_JSON` — Service account JSON for Google Vision

## Directory Map

```
/app
  /api/ocr/route.ts      # OCR server route
  /scan/page.tsx         # Camera + OCR UI + matching
  /plant/[id]/page.tsx   # Plant profile page
  /page.tsx              # Home
/data
  plants.json            # Seeded plant catalog
/lib
  /ocr/index.ts
  /ocr/googleVision.ts
/docs                    # Product docs (optional)
```

## Coding Conventions

- Keep OCR calls server-side only
- Use Tailwind for UI styles
- Keep UI clean and mobile-first
- Use App Router patterns

## Do / Don’t

**Do:**

- Keep secrets in env vars
- Add new routes under `/app`
- Keep OCR modular (swappable provider)

**Don’t:**

- Call Google Vision from the client
- Hardcode credentials
- Add complex features without updating this file

## Key Flow

1. User opens `/scan`
2. Camera captures image
3. Server calls Google Vision
4. OCR text returned to UI
5. OCR result matched against plant catalog (case-insensitive contains)
6. If match, route to `/plant/[id]` and show profile
7. If no match, show manual select dropdown

## Commands

- `npm install` — Install dependencies
- `npm run dev` — Start local dev server
- `npm run build` — Build for production
- `vercel --prod` — Deploy to Vercel

---

For questions or updates, edit this file to keep flows and conventions up to date.
