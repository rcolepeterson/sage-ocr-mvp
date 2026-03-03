import { z } from "zod";

export const PlantSchema = z.object({
  commonName: z.string().nullable(),
  latinName: z.string().nullable(),
  light: z.string().nullable(),
  water: z.string().nullable(),
  careTips: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  confidence: z.string().nullable(), // e.g. "high", "medium", "low"
});

export type PlantInfo = z.infer<typeof PlantSchema>;
