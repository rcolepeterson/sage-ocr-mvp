/* eslint-disable @typescript-eslint/no-explicit-any */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const apiKey = process.env.FLORA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing FLORA_API_KEY" },
        { status: 500 },
      );
    }

    const url = `https://api.floraapi.com/v1/search?genus=${encodeURIComponent(query)}&limit=5`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const data = await res.json();
    const first = data?.results?.[0];

    return NextResponse.json({
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
    return NextResponse.json(
      { error: err?.message || "Lookup failed" },
      { status: 500 },
    );
  }
}
