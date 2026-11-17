import { z } from "zod";
import { money } from "../budget";
import { categories, categoryNames, type Category, type Product, type Room, type Strategy, type Style } from "../types";
import { accessToken, agentProfile, callMcp } from "./mcp";

const endpoint = "https://catalog.shopify.com/api/ucp/mcp";
const image = z.object({ type: z.string(), url: z.string() });
const variant = z.object({
  id: z.string(), title: z.string().optional(), price: z.object({ amount: z.number().int().nonnegative(), currency: z.string() }).optional(),
  media: z.array(image).optional(), checkout_url: z.string().optional(),
  availability: z.object({ available: z.boolean(), status: z.string().optional(), running_low: z.boolean().optional() }).optional(),
  requires: z.object({ selling_plan: z.boolean().optional(), components: z.boolean().optional() }).optional(),
  seller: z.object({ name: z.string() }).optional(),
});
const record = z.object({ id: z.string(), title: z.string(), media: z.array(image).optional(), variants: z.array(variant).optional() });
const products = z.object({ products: z.array(record) });
const details = z.object({ product: record.optional() });
const queries: Record<Category, string> = {
  sofa: "living room apartment sofa couch", table: "living room coffee table", rug: "living room large area rug",
  lamp: "living room freestanding floor lamp", storage: "living room TV stand media console cabinet",
};
const matchCategory: Record<Category, RegExp> = {
  sofa: /\b(sofa|couch|loveseat|sectional|settee)\b/i, table: /\bcoffee table\b/i,
  rug: /\b(rug|carpet)\b/i, lamp: /\b(floor lamp|standing lamp)\b/i, storage: /\b(tv stand|tv unit|tv cabinet|media console|media cabinet|entertainment console|credenza)\b/i,
};

export function catalogCategory(title: string) {
  return categories.find(category => matchCategory[category].test(title));
}

export function liveCatalogEnabled() {
  return process.env.SHOPIFY_LIVE === "true" && Boolean(agentProfile());
}

function httpsUrl(value?: string) {
  if (!value) return;
  try { const url = new URL(value); if (url.protocol === "https:" && !url.username && !url.password) return url; }
  catch { return undefined; }
}

function normalize(entry: z.infer<typeof record>, category: Category, style?: Style): Product[] {
  return (entry.variants ?? []).flatMap(v => {
    const merchant = httpsUrl(v.checkout_url);
    if (!merchant || !v.seller?.name || !v.id.startsWith("gid://shopify/ProductVariant/") ||
      v.price?.currency !== "USD" || v.requires?.selling_plan || v.requires?.components) return [];
    const photo = [...(v.media ?? []), ...(entry.media ?? [])].find(item => item.type === "image" && httpsUrl(item.url));
    return [{
      id: entry.id, variantId: v.id, variant: v.title || "Standard", category, title: entry.title,
      merchant: v.seller.name, merchantOrigin: merchant.origin, price: v.price.amount,
      image: photo?.url ?? "/images/product-placeholder.svg", styles: style ? [style] : [],
      available: v.availability?.available === true,
      availabilityStatus: v.availability?.status,
      runningLow: v.availability?.running_low,
    }];
  });
}

async function catalogCall(name: string, catalog: object, ip?: string) {
  if (!liveCatalogEnabled()) throw new Error("Live Shopify is unavailable in this installation.");
  const token = await accessToken();
  return callMcp(endpoint, name, { catalog }, token ? { token, buyerIp: ip } : undefined);
}
const context = (zip: string) => ({ address_country: "US", currency: "USD", ...(zip ? { postal_code: zip } : {}) });

export async function searchCatalog(category: Category, room: Room, options: { like?: string; strategy?: Strategy; price?: number; cues?: string; ip?: string } = {}) {
  const save = options.strategy === "save";
  const similar = options.strategy === "similar";
  const hint = save && options.price ? ` under ${money(options.price)}` :
    similar && options.price ? ` around ${money(options.price)}` : "";
  const style = options.strategy === "explore" ? "" : room.style;
  const payload = products.parse(await catalogCall("search_catalog", {
    query: `${style} ${options.cues ?? ""} ${queries[category]}${hint}`.trim(),
    context: context(room.zip),
    filters: { available: true, condition: ["new"], ships_to: { country: "US", ...(room.zip ? { postal_code: room.zip } : {}) }, ...(save ? { price_tier: ["low"] } : {}) },
    pagination: { limit: 24 },
    ...(options.like && options.strategy !== "explore" ? { like: [{ id: options.like }] } : {}),
  }, options.ip));
  const matches = payload.products
    .filter(p => matchCategory[category].test(p.title) && !/\b(cover|replacement|miniature|dollhouse|slipcover)\b/i.test(p.title))
    .flatMap(p => normalize(p, category, style || undefined))
    .filter(p => p.available && (!save || options.price === undefined || p.price < options.price));
  return [...new Map(matches.map(p => [p.variantId, p])).values()].slice(0, 20);
}

export async function lookupCatalog(ids: string[], zip: string, categories: Map<string, Category>, ip?: string) {
  const payload = products.parse(await catalogCall("lookup_catalog", { ids, context: context(zip), filters: { available: false } }, ip));
  return payload.products.flatMap(p => (p.variants ?? []).flatMap(v => {
    const category = categories.get(v.id);
    return category ? normalize({ ...p, variants: [v] }, category) : [];
  }));
}

export async function lookupFurnitureReference(reference: string, zip: string, ip?: string) {
  const variantQuery = httpsUrl(reference)?.searchParams.get("variant");
  const variantId = reference.startsWith("gid://shopify/ProductVariant/") ? reference :
    variantQuery && /^\d+$/.test(variantQuery) ? `gid://shopify/ProductVariant/${variantQuery}` : undefined;
  const payload = products.parse(await catalogCall("lookup_catalog", {
    ids: [variantId ?? reference], context: context(zip), filters: { available: false },
  }, ip));
  const matches = payload.products.flatMap(product => {
    const category = catalogCategory(product.title);
    return category ? normalize(product, category) : [];
  });
  if (variantId) return matches.find(product => product.variantId === variantId);
  return matches.find(product => product.available) ?? matches[0];
}

export async function getProduct(id: string, category: Category, zip: string, selected: { name: string; label: string }[] = [], ip?: string) {
  const { product } = details.parse(await catalogCall("get_product", { id, context: context(zip), ...(selected.length ? { selected } : {}) }, ip));
  return product ? { title: product.title, category: categoryNames[category], variants: normalize(product, category) } : undefined;
}
