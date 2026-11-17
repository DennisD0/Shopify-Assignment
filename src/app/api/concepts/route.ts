import { z } from "zod";
import { chooseFurnitureForRoom, makeConcepts } from "@/lib/budget";
import { demoInventory } from "@/lib/demo";
import { designAdvice } from "@/lib/server/ai";
import { searchCatalog } from "@/lib/server/catalog";
import { resolveFurnitureFind } from "@/lib/server/discovery";
import { modeInput, roomInput, furnitureFindInput } from "@/lib/server/input";
import { buyerIP } from "@/lib/server/mcp";
import { categories, type Inventory, type RoomResult } from "@/lib/types";

const input = z.object({ mode: modeInput, room: roomInput, find: furnitureFindInput.optional(), workspaceOnly: z.boolean().optional() });
export const maxDuration = 40;

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check your photo, budget, ZIP code and measurements." }, { status: 400 });
  const { mode, room, find, workspaceOnly } = parsed.data;
  try {
    const ip = buyerIP(request);
    const [advice, discovered] = await Promise.all([
      mode === "live" ? designAdvice(room) : undefined,
      find ? resolveFurnitureFind(find, room, mode, ip) : undefined,
    ]);
    const inventory = mode === "demo" ? demoInventory : Object.fromEntries(await Promise.all(
      categories.map(async category => {
        const like = category === discovered?.found.category ? discovered.found.variantId : undefined;
        const found = await searchCatalog(category, room, { cues: advice?.cues, like, ip });
        const products = found.length >= 3 || !advice ? found : await searchCatalog(category, room, { ip });
        return [category, products];
      }),
    )) as Inventory;
    const decision = find && discovered ? {
      find, ...discovered,
      recommended: chooseFurnitureForRoom(discovered.found, [discovered.found, ...inventory[discovered.found.category]], room),
    } : undefined;
    const recommended = decision?.recommended;
    const catalog = recommended && !inventory[recommended.category].some(product => product.variantId === recommended.variantId) ?
      { ...inventory, [recommended.category]: [recommended, ...inventory[recommended.category]] } : inventory;
    const result: RoomResult = {
      inventory: catalog, designNote: advice?.note, decision,
      concepts: workspaceOnly || (decision && !decision.recommended) ? [] : makeConcepts(catalog, room, decision?.recommended),
    };
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: e instanceof Error && !(e instanceof z.ZodError) ? e.message : "Couldn’t read the catalog. Try again." }, { status: 502 });
  }
}
