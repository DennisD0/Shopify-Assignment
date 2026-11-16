# RoomReady

**Upload your room. Choose your look. Make it yours. Stay on budget.**

RoomReady turns a living-room photo, a style, and a budget into three furniture bundles. Shoppers can discover alternatives piece by piece, keep favorites locked, preview price-saving substitutions, and review their selections in merchant-specific carts.

## Run locally

Use Node.js 20.9 or later and npm.

```sh
npm ci
npm run dev
```

Open [RoomReady on localhost](http://localhost:3000). Demo Mode works with the bundled images and deterministic sample catalog.

## Reviewer walkthrough

1. Click **Use a sample room**, leave **Modern Minimalist** and **$1,500** selected, and create your setups.
2. Choose **Balanced Comfort**. The starting product subtotal is **$1,495**.
3. Lock the **August Linen Sofa**. Select the coffee table hotspot and switch to **Forma Travertine Table**. Watch the coffee table change in **Furniture preview** as the subtotal rises to **$1,635**. **Undo last change** restores the previous furniture layer and price.
4. Open **Make It Fit My Budget**. The proposed table substitution saves **$250** and brings the subtotal to **$1,385**. Apply it and check that the sofa is still locked.
5. Open **Review My Bundle**. Remove or add back furniture, optionally apply a delivery ZIP, and compare the simulated **Standard** and **Express** delivery estimates for each merchant. Select a shipping option to update the estimated total, then click **Order** to simulate that merchant’s order.

On a phone, swipe through the furniture cards or the alternatives in the bottom sheet. The editor keeps the subtotal and bundle review action at the bottom of the screen.

## Live configuration

Copy `.env.example` to `.env.local`. Use the same variables in a Vercel Next.js project for deployment.

| Variable | Purpose |
| --- | --- |
| `SHOPIFY_LIVE` | Set to `true` to expose the Live Shopify mode selector. |
| `SHOPIFY_UCP_PROFILE_URL` | Set to an externally reachable HTTPS UCP agent profile, such as your public deployment’s `/.well-known/ucp`. |
| `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET` | Optional for keyless Catalog and cart handoff. Supply Shopify Dev Dashboard credentials with the necessary scope for authenticated checkout creation. |
| `SHOPIFY_BUYER_IP` | Optional public IP for local authenticated checkout tests. On Vercel the app uses the platform's forwarding header. |
| `SHOPIFY_MERCHANT_DOMAINS` | Comma-separated, operator-verified custom Shopify storefront hostnames permitted for server-side UCP discovery. Standard `*.myshopify.com` hosts are supported by default. |
| `ROOMREADY_AI_PROVIDER` | Optional `openai` or `anthropic`. Live generation sends the chosen style and any uploaded photo to the configured provider for palette and material cues. |
| `ROOMREADY_AI_MODEL` | Vision-capable model ID. OpenAI defaults to `gpt-4.1-mini`. Anthropic requires an explicit model ID. |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | Server-only key for the selected provider. |

Live mode searches Shopify Global Catalog MCP for US/USD offers. It uses Catalog similarity and relative price tiers where applicable, then sorts or filters normalized variant prices in cents. Shopify product records drive the shopping bundle. Dimensions are shown and checked when supplied by the source. Live records without verified dimensions prompt a manual fit check. [Shopify Global Catalog MCP](https://shopify.dev/docs/agents/catalog/global-catalog) · [Global Catalog extension](https://shopify.dev/docs/agents/catalog/global-catalog-extension)

RoomReady rechecks prices and availability before preparing a cart. It discovers the storefront’s UCP capabilities, creates and retrieves a separate cart for each merchant, and uses an authenticated checkout session when supported. The merchant-supplied cart link is available for checkout handoff when session creation is unavailable. The buyer completes payment with the merchant. [Shopify Cart MCP](https://shopify.dev/docs/agents/carts-and-checkout/cart-mcp) · [Shopify Checkout MCP](https://shopify.dev/docs/agents/carts-and-checkout/checkout-mcp)

Demo Mode uses fictional merchants, generated furniture images, and simulated carts. In Customize, furniture cutouts sit on an empty sample room at approximate scale. Swaps, approved substitutions, and Undo update those layers. Live mode displays merchant product photos in a catalog collage. Inspiration and uploaded room photos are available in separate views, and the optional vision provider can use uploads for style cues. The app uses manual measurements for simple footprint checks and leaves clearances to the shopper. The demo draft is saved in the browser. Live product snapshots stay in memory and expire after ten minutes. Room inputs are saved locally in both modes. [Shopify catalog usage guidelines](https://shopify.dev/docs/agents/catalog#usage-guidelines)

## Project layout

- `src/app` contains the Next.js app and the server endpoints for concepts, alternative products, and merchant checkout.
- `src/components` contains the responsive setup, concept, editor, and review screens, plus shadcn-style button and Radix dialog components.
- `src/lib` contains the Zustand store, product and room models, deterministic budget functions, and demo data.
- `src/lib/server` contains the Shopify, UCP, and optional AI provider adapters.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
```
