export const runtime = "nodejs";

import { streamObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { PlantSchema } from "@/lib/llm/schema";

export async function POST(req: Request) {
  const body = await req.json();
  const query = body?.prompt || body?.query || "";

  if (!query) {
    return new Response("Missing query", { status: 400 });
  }

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const result = streamObject({
    model: google("gemini-2.5-flash"),
    schema: PlantSchema,
    system:
      "You are a horticulture expert. Return a structured response that matches the schema. If unknown, set fields to null and keep arrays empty.",
    prompt: `Plant name or OCR text: "${query}". Provide best-effort plant care info.`,
  });

  return result.toTextStreamResponse();
}
