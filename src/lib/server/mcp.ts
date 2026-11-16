import { isIP } from "node:net";
import { z } from "zod";

export const agentProfile = () => process.env.SHOPIFY_UCP_PROFILE_URL;
const reply = z.object({ result: z.object({ isError: z.boolean().optional(), structuredContent: z.unknown().optional() }).optional() });
let token: { value: string; expires: number } | undefined;
let authenticating: Promise<string> | undefined;

async function exchange() {
  const result = await fetch("https://api.shopify.com/auth/access_token", {
    method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", signal: AbortSignal.timeout(7000),
    body: JSON.stringify({ client_id: process.env.SHOPIFY_CLIENT_ID, client_secret: process.env.SHOPIFY_CLIENT_SECRET, grant_type: "client_credentials" }),
  });
  if (!result.ok) throw new Error("Shopify authentication failed.");
  const { access_token, expires_in } = z.object({ access_token: z.string().min(1), expires_in: z.number().optional() }).parse(await result.json());
  token = { value: access_token, expires: Date.now() + Math.max(0, (expires_in ?? 3600) - 120) * 1000 };
  return token.value;
}

export async function accessToken() {
  if (!process.env.SHOPIFY_CLIENT_ID || !process.env.SHOPIFY_CLIENT_SECRET) return undefined;
  if (token && token.expires > Date.now()) return token.value;
  authenticating ??= exchange().finally(() => { authenticating = undefined; });
  return authenticating;
}

export function buyerIP(request: Request): string | undefined {
  const value = process.env.SHOPIFY_BUYER_IP ||
    (process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() : undefined);
  return value && isIP(value) ? value : undefined;
}

export async function callMcp(endpoint: string, name: string, args: object, auth?: { token: string; buyerIp?: string }) {
  const profile = agentProfile();
  if (!profile) throw new Error("Configure the public UCP agent profile.");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) headers.Authorization = `Bearer ${auth.token}`;
  if (auth?.buyerIp) headers["Shopify-Buyer-IP"] = auth.buyerIp;
  const response = await fetch(endpoint, {
    method: "POST", headers, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(9000),
    body: JSON.stringify({ jsonrpc: "2.0", id: crypto.randomUUID(), method: "tools/call",
      params: { name, arguments: { ...args, meta: { "ucp-agent": { profile } } } },
    }),
  });
  if (!response.ok) throw new Error(`Shopify ${name} returned HTTP ${response.status}.`);
  const { result } = reply.parse(await response.json());
  if (!result || result.isError || !result.structuredContent) throw new Error(`Shopify could not complete ${name}.`);
  return result.structuredContent;
}
