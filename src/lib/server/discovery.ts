import type { Mode, Product, Room, SofaFind } from "../types";
import { demoInventory } from "../demo";
import { lookupSofaReference, searchCatalog } from "./catalog";

const listingPath = /\/products?\//;
const ignoredWords = new Set(["sofa", "couch", "try", "the", "with", "from", "for"]);

function catalogReference(text: string) {
  if (/^gid:\/\/shopify\/(ProductVariant|Product|p)\/[a-zA-Z\d]+$/.test(text)) return text;
  for (const match of text.matchAll(/https:\/\/[^\s<>"']+/g)) {
    try {
      const url = new URL(match[0].replace(/[),.;]+$/, ""));
      const productPage = listingPath.test(url.pathname) || (url.hostname === "shop.app" && url.pathname.startsWith("/p/"));
      if (productPage && !url.username && !url.password) return url.href;
    } catch { /* Continue looking for a supported listing reference. */ }
  }
}

function demoMatch(reference: string): Product | undefined {
  const text = reference.toLowerCase();
  return demoInventory.sofa.find(product => text === product.id || text === product.variantId || text.includes(product.title.toLowerCase()));
}

export async function resolveSofaFind(find: SofaFind, room: Room, mode: Mode, ip?: string) {
  const reference = find.reference.trim();
  const listing = catalogReference(reference);
  if (mode === "live" && listing) {
    const found = await lookupSofaReference(listing, room.zip, ip);
    if (found) return { found, match: "exact" as const };
    throw new Error("Shopify Catalog couldn’t resolve that sofa listing. Try the product name or paste the recommendation text.");
  }
  const exact = mode === "demo" ? demoMatch(reference) : undefined;
  if (exact) return { found: exact, match: "exact" as const };
  const description = reference.replace(/https?:\/\/[^\s]+/g, "").trim();
  if (description.length < 3) {
    throw new Error("Add the sofa name or describe what you saw. Include the product name when sharing a social post link.");
  }
  if (mode === "live") {
    const [found] = await searchCatalog("sofa", room, { cues: description, ip });
    if (found) return { found, match: "suggestion" as const };
  } else {
    const words = description.toLowerCase().match(/[a-z]{3,}/g)?.filter(word => !ignoredWords.has(word)) ?? [];
    const ranked = demoInventory.sofa.map(product => {
      const details = `${product.title} ${product.variant}`.toLowerCase();
      return { product, score: new Set(words.filter(word => details.includes(word))).size };
    }).sort((a, b) => b.score - a.score);
    if (ranked[0].score > 0) return { found: ranked[0].product, match: "suggestion" as const };
  }
  throw new Error("We couldn’t match that recommendation. Add the product name or a detail such as its color or fabric, or try the shared sofa example.");
}
