import { z } from "zod";
import { money } from "@/lib/budget";
import { demoInventory } from "@/lib/demo";
import { lookupCatalog } from "@/lib/server/catalog";
import { buyerIP } from "@/lib/server/mcp";
import { createCart, createCheckout, discoverMerchant, getCart, handoffUrl } from "@/lib/server/ucp";
import { categoryInput, modeInput, variantInput, zipInput } from "@/lib/server/input";

const input = z.object({
  mode: modeInput, zip: zipInput, lines: z.array(z.object({
    variantId: z.string().max(120), quantity: z.number().int().min(1).max(10),
    expectedPrice: z.number().int().nonnegative(), category: categoryInput,
  })).min(1).max(5),
});
export const maxDuration = 45;

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "This merchant bundle is invalid." }, { status: 400 });
  const { mode, lines, zip } = parsed.data;
  const ids = lines.map(line => line.variantId);
  if (new Set(ids).size !== ids.length) return Response.json({ error: "Cart lines must be unique." }, { status: 400 });
  try {
    if (mode === "demo") {
      const items = lines.map(line => demoInventory[line.category].find(p => p.variantId === line.variantId && p.price === line.expectedPrice));
      if (items.some(p => !p) || new Set(items.map(p => p?.merchant)).size !== 1) throw new Error("Choose sample products from one demo merchant per cart.");
      return Response.json({ demo: true });
    }
    if (ids.some(id => !variantInput.safeParse(id).success)) throw new Error("Choose live Shopify variants for this cart.");
    const ip = buyerIP(request);
    const products = await lookupCatalog(ids, zip, new Map(lines.map(line => [line.variantId, line.category])), ip);
    for (const line of lines) {
      const product = products.find(p => p.variantId === line.variantId);
      if (!product?.available) throw new Error(`${product?.title ?? "A selected item"} is no longer available. Swap it before continuing.`);
      if (product.price !== line.expectedPrice) throw new Error(`${product.title} changed from ${money(line.expectedPrice)} to ${money(product.price)}. Refresh your room concepts to see current prices.`);
    }
    const origin = products[0]?.merchantOrigin;
    if (!origin || products.some(p => p.merchantOrigin !== origin)) throw new Error("Prepare each merchant’s cart separately.");

    const merchant = await discoverMerchant(origin);
    const created = await createCart(merchant, lines.map(line => ({ quantity: line.quantity, item: { id: line.variantId } })), zip);
    const cart = await getCart(merchant, created.id);
    if (cart.currency !== "USD" || lines.some(line => !cart.line_items?.some(item => item.item.id === line.variantId && item.quantity === line.quantity))) {
      throw new Error("The merchant changed cart availability or quantities. Review the products before continuing.");
    }
    const checkout = await createCheckout(merchant, cart.id, ip).catch(() => undefined);
    const url = handoffUrl(checkout?.continue_url) ?? handoffUrl(cart.continue_url);
    if (!url) throw new Error("This merchant didn’t return a checkout link.");
    const totals = checkout?.totals ?? cart.totals;
    const cartSubtotal = totals?.find(total => total.type === "subtotal")?.amount;
    const expectedSubtotal = lines.reduce((sum, line) => sum + line.expectedPrice * line.quantity, 0);
    const changedLine = (checkout?.line_items ?? cart.line_items)?.some(item =>
      item.item.price !== undefined && lines.some(line => line.variantId === item.item.id && item.item.price !== line.expectedPrice));
    const warning = cartSubtotal !== undefined && cartSubtotal !== expectedSubtotal ?
      `The merchant quoted a ${money(cartSubtotal)} product subtotal. Review the price before buying.` :
      changedLine ? "A line price changed. Review the merchant’s prices before buying." : undefined;
    return Response.json({
      url, warning, shipping: totals?.find(total => total.type === "fulfillment")?.amount,
      tax: totals?.find(total => total.type === "tax")?.amount,
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error && !(e instanceof z.ZodError) ? e.message : "The merchant couldn’t prepare this cart." }, { status: 422 });
  }
}
