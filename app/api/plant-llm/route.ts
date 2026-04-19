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
      "You are a horticulture expert. Return a structured response that matches the schema. If unknown, set fields to null and keep arrays empty. Based on the plant identified, assign all relevant tags from the provided list. A plant can and should have multiple tags — stack all that apply across every category. Consider the Pacific Northwest (Seattle) climate when assigning PNW-specific and seasonal tags. Be generous with upsell tags — if there is any reasonable upsell opportunity, include it. Also return a structured lightLevel as one of: 'low', 'medium', or 'high'. 'high' = full sun (6+ hours direct sunlight), 'medium' = part sun / part shade (3-6 hours), 'low' = full shade (less than 3 hours).",
    prompt: `Plant name or OCR text: "${query}". Provide best-effort plant care info.\n\nValid tags (for the tags array):\n\nPlant Type: fruit-tree, ornamental-tree, evergreen-tree, deciduous-shrub, evergreen-shrub, flowering-shrub, shade-perennial, sun-perennial, ornamental-grass, ground-cover, climbing-vine, annual-flower, tropical-annual, bulb, fern, hosta, rose, rhododendron, azalea, hydrangea, lavender, herb, vegetable-starts, tomato, berry-bush, succulent, houseplant, bonsai, water-plant, edible-flower\n\nLight: full-sun-plant, part-shade-plant, full-shade-plant, adaptable-light\n\nWater: drought-tolerant, moderate-water, high-water, moisture-lover\n\nSeasonal: spring-bloomer, summer-bloomer, fall-bloomer, winter-interest, spring-ephemeral, deciduous, evergreen\n\nCare Complexity: beginner-friendly, intermediate-care, expert-care\n\nPest & Disease: slug-risk, aphid-risk, powdery-mildew-risk, deer-risk, root-rot-risk, virus-risk, scale-risk\n\nContainer: container-friendly, needs-ground-space, raised-bed-ideal, hanging-basket\n\nPNW Specific: pnw-native, pnw-adapted, rain-tolerant, heat-sensitive, frost-tender, winter-hardy\n\nUpsell: needs-fertilizer-spring, needs-fertilizer-fall, needs-pruning-tools, needs-support-structure, needs-soil-amendment, needs-pest-control, needs-mulch, pot-upgrade-candidate, companion-planting-opportunity\n\nAssign all relevant tags for this plant. Also return a structured lightLevel as one of: 'low', 'medium', or 'high'. 'high' = full sun (6+ hours direct sunlight), 'medium' = part sun / part shade (3-6 hours), 'low' = full shade (less than 3 hours).`,
  });

  return result.toTextStreamResponse();
}
