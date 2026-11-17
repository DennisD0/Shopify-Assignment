import { z } from "zod";
import { chooseSofaForRoom, makeConcepts } from "@/lib/budget";
import { demoInventory } from "@/lib/demo";
import { designAdvice } from "@/lib/server/ai";
import { searchCatalog } from "@/lib/server/catalog";
import { resolveSofaFind } from "@/lib/server/discovery";
import { modeInput, roomInput, sofaFindInput } from "@/lib/server/input";
import { buyerIP } from "@/lib/server/mcp";
import { categories, type Inventory, type RoomResult } from "@/lib/types";

const input = z.object({ mode: modeInput, room: roomInput, find: sofaFindInput.optional() });
export const maxDuration = 40;

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check your photo, budget, ZIP code and measurements." }, { status: 400 });
  const { mode, room, find } = parsed.data;
  try {
    const ip = buyerIP(request);
    const [advice, discovered] = await Promise.all([
      mode === "live" ? designAdvice(room) : undefined,
      find ? resolveSofaFind(find, room, mode, ip) : undefined,
    ]);
    const inventory = mode === "demo" ? demoInventory : Object.fromEntries(await Promise.all(
      categories.map(async category => {
        const like = category === "sofa" ? discovered?.found.variantId : undefined;
        const found = await searchCatalog(category, room, { cues: advice?.cues, like, ip });
        const products = found.length >= 3 || !advice ? found : await searchCatalog(category, room, { ip });
        return [category, products];
      }),
    )) as Inventory;
    const decision = find && discovered ? {
      find, ...discovered,
      recommended: chooseSofaForRoom(discovered.found, [discovered.found, ...inventory.sofa], room),
    } : undefined;
    const catalog = decision?.recommended && !inventory.sofa.some(product => product.variantId === decision.recommended?.variantId) ?
      { ...inventory, sofa: [decision.recommended, ...inventory.sofa] } : inventory;
    const result: RoomResult = {
      inventory: catalog, designNote: advice?.note, decision,
      concepts: decision && !decision.recommended ? [] : makeConcepts(catalog, room, decision?.recommended),
    };
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: e instanceof Error && !(e instanceof z.ZodError) ? e.message : "Couldn’t read the catalog. Try again." }, { status: 502 });
  }
}
