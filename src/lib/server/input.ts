import { z } from "zod";
import { discoverySources, socialPlatforms, styles } from "../types";

export const zipInput = z.string().regex(/^(?:\d{5})?$/);
export const categoryInput = z.enum(["sofa", "table", "rug", "lamp", "storage"]);
export const modeInput = z.enum(["demo", "live"]);
export const variantInput = z.string().regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/);
export const sofaFindInput = z.object({
  reference: z.string().trim().min(3).max(500),
  source: z.enum(discoverySources),
  platform: z.enum(socialPlatforms).optional(),
});
export const roomInput = z.object({
  photo: z.string().max(1_750_000).regex(/^(?:\/images\/room\.webp|data:image\/jpeg;base64,[A-Za-z0-9+/]+=*)$/),
  style: z.enum(styles), budget: z.number().int().min(100).max(10_000_000),
  width: z.number().min(0).max(100), depth: z.number().min(0).max(100), zip: zipInput,
  sofaSpace: z.object({ width: z.number().min(0).max(300), depth: z.number().min(0).max(300) }).optional(),
}).refine(room => Boolean(room.width) === Boolean(room.depth));
