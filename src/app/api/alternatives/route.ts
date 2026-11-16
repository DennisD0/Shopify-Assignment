import { z } from "zod";
import { searchCatalog } from "@/lib/server/catalog";
import { categoryInput, roomInput, variantInput } from "@/lib/server/input";
import { buyerIP } from "@/lib/server/mcp";

const input = z.object({
  product: z.object({ variantId: variantInput, category: categoryInput, price: z.number().int().nonnegative() }),
  room: roomInput, strategy: z.enum(["similar", "save", "explore"]),
});
export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check your alternative search." }, { status: 400 });
  const { product, room, strategy } = parsed.data;
  try {
    return Response.json({ products: await searchCatalog(product.category, room, { strategy, like: product.variantId, price: product.price, ip: buyerIP(request) }) });
  } catch {
    return Response.json({ error: "Shopify alternatives are temporarily unavailable." }, { status: 502 });
  }
}
