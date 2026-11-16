import { z } from "zod";
import { makeConcepts } from "@/lib/budget";
import { demoInventory } from "@/lib/demo";
import { designAdvice } from "@/lib/server/ai";
import { searchCatalog } from "@/lib/server/catalog";
import { modeInput, roomInput } from "@/lib/server/input";
import { buyerIP } from "@/lib/server/mcp";
import { categories, type Inventory, type RoomResult } from "@/lib/types";

const input = z.object({ mode: modeInput, room: roomInput });
export const maxDuration = 40;

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check your photo, budget, ZIP code and measurements." }, { status: 400 });
  const { mode, room } = parsed.data;
  try {
    const advice = mode === "live" ? await designAdvice(room) : undefined;
    const inventory = mode === "demo" ? demoInventory : Object.fromEntries(await Promise.all(
      categories.map(async category => {
        const ip = buyerIP(request);
        const found = await searchCatalog(category, room, { cues: advice?.cues, ip });
        const products = found.length >= 3 || !advice ? found : await searchCatalog(category, room, { ip });
        return [category, products];
      }),
    )) as Inventory;
    const result: RoomResult = { inventory, concepts: makeConcepts(inventory, room), designNote: advice?.note };
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: e instanceof Error && !(e instanceof z.ZodError) ? e.message : "Couldn’t read the catalog. Try again." }, { status: 502 });
  }
}
