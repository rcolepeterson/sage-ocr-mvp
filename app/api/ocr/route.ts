export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import vision from "@google-cloud/vision";

export async function POST(req: NextRequest) {
  try {
    const credsRaw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const creds = credsRaw ? JSON.parse(credsRaw) : undefined;

    if (creds?.private_key) {
      creds.private_key = creds.private_key.replace(/\\n/g, "\n");
    }

    const client = new vision.ImageAnnotatorClient({
      credentials: creds,
      fallback: true, // REST fallback for serverless
    });

    const { imageBase64 } = await req.json();
    if (!imageBase64) return NextResponse.json({ text: "" });

    const base64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const [result] = await client.textDetection({ image: { content: base64 } });

    const text =
      result.fullTextAnnotation?.text ||
      result.textAnnotations?.[0]?.description ||
      "";

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("[OCR] error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "OCR failed" },
      { status: 500 },
    );
  }
}
