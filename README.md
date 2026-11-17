# RoomReady

RoomReady helps first-time renters furnish a room in stages. A buyer post or shared recommendation leads into a room plan. At review, shoppers can compare what to buy now and what can wait based on their budget and move-in date.

## Run locally

Use Node.js 20.9 or later and npm.

```sh
npm ci
npm run dev
```

Open [RoomReady on localhost](http://localhost:3000). Demo Mode works with the bundled images and deterministic sample catalog.

## Reviewer walkthrough

1. Open the [Home feed](http://localhost:3000). Read Ria’s sample Reddit post about the Cove Oval Coffee Table. Check its price, dimensions, and the merchant’s average arrival time from sample buyer reports. Bookmark the table.
2. Open **My room** to go directly to **Customize**. A new room starts empty. Open **Saved furniture** and choose **Use in room** on the Cove. In **Swap**, use **Buyer favorites** to see alternatives that sample shoppers also liked. **Room preferences** lets you change the budget and add your own room photo.
3. Add a few pieces and open **Review My Bundle** to see dimensions, prices, and sample buyer comments and delivery averages. In **Buy now / Buy later**, choose **Use sample budget and date** to compare purchase phases. Apply a plan to load its buy-now pieces and delivery methods into the merchant carts. Click **Order** to simulate checkout.

Demo Mode resolves sample names and share links locally. The feed includes representative Instagram and TikTok posts, an AI recommendation, and a shared conversation. Live Shopify uses Catalog lookup for product links and Catalog search for pasted recommendations. Text search returns a labeled suggestion. If a social URL does not contain a product listing, include the product name or caption. Live inventory supplies no buyer identities or purchase proof in this prototype. Use available dimensions and the shopper’s entered space to check fit.

On desktop, the left rail opens Home, Saved, and My room. On a phone, those destinations are in the floating bottom menu. Swipe through furniture cards and alternatives in the editor, with the budget and review action above the menu.

## Live configuration

Copy `.env.example` to `.env.local`. Use the same variables in a Vercel Next.js project for deployment.

| Variable | Purpose |
| --- | --- |
| `SHOPIFY_LIVE` | Set to `true` to expose the Live Shopify mode selector. |
| `SHOPIFY_UCP_PROFILE_URL` | Set to an externally reachable HTTPS UCP agent profile, such as your public deployment’s `/.well-known/ucp`. |
| `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET` | Optional for keyless Catalog and cart handoff. Supply Shopify Dev Dashboard credentials with the necessary scope for authenticated checkout creation. |
| `SHOPIFY_BUYER_IP` | Optional public IP for local authenticated checkout tests. On Vercel the app uses the platform's forwarding header. |
| `SHOPIFY_MERCHANT_DOMAINS` | Comma-separated, operator-verified custom Shopify storefront hostnames permitted for server-side UCP discovery. Standard `*.myshopify.com` hosts are supported by default. |
| `ROOMREADY_AI_PROVIDER` | Optional `openai` or `anthropic`. Live generation sends style and any uploaded photo for design guidance. Buy now / Buy later sends computed sample plan totals and delivery evidence for an explanation. Without a provider, the app shows a rule-based comparison. |
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
