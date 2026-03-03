/* eslint-disable @typescript-eslint/no-explicit-any */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    const cleanQuery = String(query).trim();
    if (!cleanQuery) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const apiKey = process.env.FLORA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing FLORA_API_KEY" },
        { status: 500 },
      );
    }

    const url = `https://api.floraapi.com/v1/search?q=${encodeURIComponent(cleanQuery)}&limit=5`;
    console.log("[flora] url", url);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    console.log("[flora] status", res.status);

    const data = await res.json();
    const results = data?.results || [];
    console.log("[flora] results count", results.length);

    const first = results[0];
    if (!first) {
      return NextResponse.json(
        { found: false, message: "No results found" },
        { status: 200 },
      );
    }

    return NextResponse.json({
      found: true,
      commonName: first?.common_names?.[0] || null,
      latinName: first?.scientific_name || null,
      family: first?.family_name || null,
      genus: first?.genus_name || null,
      usdaSymbol: first?.usda_symbol || null,
      imageUrl: first?.preferred_image_url || null,
      source: "Flora API",
      raw: first || null,
    });
  } catch (err: any) {
    console.error("[flora] error", err);
    return NextResponse.json(
      { error: err?.message || "Lookup failed" },
      { status: 500 },
    );
  }
}
