# Sage — Swansons Nursery Plant Care

A web-based plant care system for Swansons Nursery.

## Getting Started

npm install
npm run dev

## Deploy

npx vercel --prod

## Environment Variables

NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sage-swansons-e4677.firebaseapp.com ← do NOT change to Vercel URL
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY
NEXT_PUBLIC_FIREBASE_VAPID_KEY
GOOGLE_APPLICATION_CREDENTIALS_JSON
FIREBASE_ADMIN_CREDENTIALS_JSON

## Google Cloud & AI Setup

All services run on a single Google Cloud project: **sage-swansons-e4677**

### Authentication

One service account handles both AI services:
`sage-ocr-service@sage-swansons-e4677.iam.gserviceaccount.com`

Store the full JSON key as a single line in:

- `.env.local` → `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- Vercel → `GOOGLE_APPLICATION_CREDENTIALS_JSON` (save as Sensitive)

### OCR — Google Vision API

- Authenticated via `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- Called server-side only in `/app/api/ocr/route.ts`
- Never call Google Vision from the client

### LLM — Gemini via Vertex AI

- Model: `gemini-2.5-flash`
- Authenticated via `GOOGLE_APPLICATION_CREDENTIALS_JSON` (same service account)
- **Not** using an API key — uses Vertex AI (`@ai-sdk/google-vertex`) billed through GCP billing
- Route: `/app/api/plant-llm/route.ts`

### Firebase

- Project: `sage-swansons-e4677`
- Firebase Admin SDK uses a separate key: `FIREBASE_ADMIN_CREDENTIALS_JSON`
- Do NOT mix up the two keys — they are different service accounts for different purposes:
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` → sage-ocr-service (OCR + Vertex AI LLM)
- `FIREBASE_ADMIN_CREDENTIALS_JSON` → firebase-adminsdk (Firebase Admin SDK)

### Important

- `GOOGLE_APPLICATION_CREDENTIALS_JSON` must be stored as a single line — no line breaks
- Use `cat key.json | tr -d '\n'` to flatten before saving

## Tech Stack

Next.js, TypeScript, Tailwind, Firebase, Vercel

## AI Helper URLS

Dashboard
https://imagine.wpp.ai/chat/6jQJv4kOvypySOa1V4LYj/foundational?resultId=4xrTZ3wV9OnRGqTYPSr2M
