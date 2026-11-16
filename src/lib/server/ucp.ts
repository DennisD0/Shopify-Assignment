import { z } from "zod";
import { accessToken, callMcp } from "./mcp";

const version = "2026-08-25";
const document = z.object({ ucp: z.object({
  services: z.record(z.string(), z.array(z.object({ version: z.string(), transport: z.string(), endpoint: z.string().optional() }))),
  capabilities: z.record(z.string(), z.array(z.object({ version: z.string() }))),
}) });
const resource = z.object({
  id: z.string(), currency: z.string(), continue_url: z.string().optional(),
  totals: z.array(z.object({ type: z.string(), amount: z.number().int() })).optional(),
  line_items: z.array(z.object({ item: z.object({ id: z.string(), price: z.number().int().optional() }), quantity: z.number().int() })).optional(),
});
const cartResult = z.object({ cart: resource });
type CartItem = { item: { id: string }; quantity: number };
type Merchant = { endpoint: string; checkout: boolean };

export async function discoverMerchant(origin: string): Promise<Merchant> {
  // Only connect to Shopify-hosted storefronts or domains explicitly approved by the operator.
  const url = new URL(origin);
  const allow = (process.env.SHOPIFY_MERCHANT_DOMAINS ?? "").split(",").map(domain => domain.trim().toLowerCase());
  if (url.protocol !== "https:" || url.port || url.origin !== origin ||
    !(/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(url.hostname) || allow.includes(url.hostname))) {
    throw new Error("This merchant’s checkout domain has not been enabled.");
  }
  const response = await fetch(`${origin}/.well-known/ucp`, { redirect: "error", cache: "no-store", signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error("This merchant doesn’t publish a UCP profile.");
  const { ucp } = document.parse(await response.json());
  const service = ucp.services["dev.ucp.shopping"]?.find(s => s.transport === "mcp" && s.version === version && s.endpoint);
  const supports = (name: string) => ucp.capabilities[`dev.ucp.shopping.${name}`]?.some(c => c.version === version) ?? false;
  if (!service?.endpoint || new URL(service.endpoint).origin !== origin || !supports("cart")) {
    throw new Error("This merchant doesn’t advertise a supported UCP cart.");
  }
  return { endpoint: service.endpoint, checkout: supports("checkout") };
}

const cartPayload = (items: CartItem[], zip: string) => ({
  line_items: items, context: { address_country: "US", ...(zip ? { postal_code: zip } : {}) },
});
export async function createCart(merchant: Merchant, items: CartItem[], zip: string) {
  return cartResult.parse(await callMcp(merchant.endpoint, "create_cart", { cart: cartPayload(items, zip) })).cart;
}
export async function getCart(merchant: Merchant, id: string) {
  return cartResult.parse(await callMcp(merchant.endpoint, "get_cart", { id })).cart;
}
export async function updateCart(merchant: Merchant, id: string, items: CartItem[], zip: string) {
  return cartResult.parse(await callMcp(merchant.endpoint, "update_cart", { id, cart: cartPayload(items, zip) })).cart;
}
export async function createCheckout(merchant: Merchant, id: string, buyerIp?: string) {
  if (!merchant.checkout || !buyerIp) return;
  const token = await accessToken();
  if (!token) return;
  return resource.parse(await callMcp(merchant.endpoint, "create_checkout", {
    checkout: { cart_id: id, line_items: [] },
  }, { token, buyerIp }));
}

export function handoffUrl(value?: string) {
  if (!value) return;
  const url = new URL(value);
  if (url.protocol === "https:" && !url.username && !url.password) return url.href;
}
