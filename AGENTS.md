Sage OCR MVP — Agent Guide
Project Overview
Sage is a web-based plant care system for Swansons Nursery. The MVP enables users to scan plant tags, extract text via OCR, and stream structured plant info from an LLM.

MVP Scope
Implemented:

Home page (/)
Scan page (/scan): camera, OCR, matching
OCR via Google Vision (server-side)
Seeded plant catalog
Plant profile page (/plant/[id])
LLM plant info lookup (Gemini, streaming)
Planned:

Reminders/notifications
Ask-an-expert chat
Admin/staff tools
Tech Stack
Next.js (App Router)
TypeScript
Tailwind CSS
Vercel hosting
Google Vision API
Vercel AI SDK (Gemini)
Environment Variables
GOOGLE_APPLICATION_CREDENTIALS_JSON: Service account JSON for Google Vision
GEMINI_API_KEY: Gemini LLM API key
FLORA_API_KEY: Flora API key (plant lookup route)
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
/docs # Product docs (optional)
LLM Streaming Details
Frontend uses useCompletion from @ai-sdk/react
streamProtocol: "text" is required
Partial JSON is parsed with parsePartialJson(completion)
LLM route uses streamObject and returns toTextStreamResponse()
Model name: gemini-2.5-flash (stable)
Coding Conventions
Keep OCR calls server-side only
Use Tailwind for UI styles
UI must be clean and mobile-first
Use App Router patterns
LLM responses must follow schema
Do / Don’t
Do:

Keep secrets in env vars
Add new routes under /app
Keep OCR modular (swappable provider)
Stream LLM output when possible
Don’t:

Call Google Vision from the client
Hardcode credentials
Return unstructured LLM output
Key Flow (MVP POC)
User opens /scan
Camera captures image
Server calls Google Vision
OCR text returned to UI
OCR text sent to LLM route
LLM streams structured plant info (schema)
Commands
npm install # Install dependencies
npm run dev # Start local dev server
npm run build # Build for production
vercel --prod # Deploy to Vercel
