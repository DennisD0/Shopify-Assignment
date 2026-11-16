import test from "node:test";
import assert from "node:assert/strict";
import { POST as checkout } from "../src/app/api/checkout/route";
import { demoInventory } from "../src/lib/demo";
import { quoteDemoDelivery, type DemoDeliveryOption } from "../src/lib/demo-delivery";

const sofa = demoInventory.sofa[1];
const lamp = demoInventory.lamp[1];
const table = demoInventory.table[1];
const request = (lines: { category: string; variantId: string; price: number }[], zip = "", deliveryOption?: DemoDeliveryOption) => new Request("http://localhost/api/checkout", {
  method: "POST", body: JSON.stringify({ mode: "demo", zip, deliveryOption, lines: lines.map(({ price, ...line }) => ({ ...line, expectedPrice: price, quantity: 1 })) }),
});

test("demo checkout returns a simulated cart for one merchant without a purchase URL", async () => {
  const response = await checkout(request([sofa, lamp]));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    demo: true, delivery: quoteDemoDelivery(sofa.merchant, "").standard, total: sofa.price + lamp.price + 2400,
  });
});

test("demo checkout quotes Express for the submitted ZIP and totals shipping separately", async () => {
  const zip = "90210";
  const options = quoteDemoDelivery(sofa.merchant, zip);
  assert.ok(options.express.maxDays < options.standard.minDays);
  assert.ok(options.express.minDays > quoteDemoDelivery(sofa.merchant, "10001").express.minDays);
  const response = await checkout(request([sofa], zip, "express"));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { demo: true, delivery: options.express, total: sofa.price + 4900 });
});

test("demo checkout rejects mixed merchants and stale prices", async () => {
  assert.equal((await checkout(request([sofa, table]))).status, 422);
  assert.equal((await checkout(request([{ ...sofa, price: 1 }]))).status, 422);
});

test("live review discovers the storefront and uses its UCP cart handoff when checkout authentication is absent", async (t) => {
  const env = { ...process.env };
  t.after(() => { process.env = env; });
  process.env.SHOPIFY_LIVE = "true";
  process.env.SHOPIFY_UCP_PROFILE_URL = "https://roomready.example/.well-known/ucp";
  delete process.env.SHOPIFY_CLIENT_ID;
  delete process.env.SHOPIFY_CLIENT_SECRET;
  const variantId = "gid://shopify/ProductVariant/123456";
  const origin = "https://merchant-example.myshopify.com";
  const version = "2026-08-25";
  const url = origin + "/cart/c/example?key=abc";
  const cart = {
    id: "gid://shopify/Cart/opaque?key=abc", currency: "USD", continue_url: url,
    line_items: [{ item: { id: variantId, price: 71000 }, quantity: 1 }],
    totals: [{ type: "subtotal", amount: 71000 }, { type: "fulfillment", amount: 1200 }],
  };
  const calls: string[] = [];
  t.mock.method(globalThis, "fetch", async (endpoint: string, request?: RequestInit) => {
    if (endpoint === origin + "/.well-known/ucp") {
      calls.push("discover");
      return Response.json({ ucp: {
        services: { "dev.ucp.shopping": [{ version, transport: "mcp", endpoint: origin + "/api/ucp/mcp" }] },
        capabilities: { "dev.ucp.shopping.cart": [{ version }], "dev.ucp.shopping.checkout": [{ version }] },
      } });
    }
    const { params } = JSON.parse(String(request?.body));
    calls.push(params.name);
    if (params.name === "lookup_catalog") {
      assert.equal(endpoint, "https://catalog.shopify.com/api/ucp/mcp");
      assert.deepEqual(params.arguments.catalog.ids, [variantId]);
      return Response.json({ result: { structuredContent: { products: [{
        id: "gid://shopify/p/sample", title: "Linen Sofa", variants: [{
          id: variantId, title: "Oat", price: { amount: 69900, currency: "USD" }, availability: { available: true },
          seller: { name: "Merchant Example" }, checkout_url: origin + "/cart/123456:1",
        }],
      }] } } });
    }
    assert.equal(endpoint, origin + "/api/ucp/mcp");
    if (params.name === "create_cart") assert.deepEqual(params.arguments.cart.line_items, [{ item: { id: variantId }, quantity: 1 }]);
    if (params.name === "get_cart") assert.equal(params.arguments.id, cart.id);
    return Response.json({ result: { structuredContent: { cart } } });
  });
  const response = await checkout(new Request("http://localhost/api/checkout", {
    method: "POST", body: JSON.stringify({
      mode: "live", zip: "10001", lines: [{ variantId, category: "sofa", quantity: 1, expectedPrice: 69900 }],
    }),
  }));
  assert.equal(response.status, 200);
  const handoff = await response.json();
  assert.equal(handoff.url, url);
  assert.equal(handoff.shipping, 1200);
  assert.match(handoff.warning, /\$710 product subtotal/);
  assert.deepEqual(calls, ["lookup_catalog", "discover", "create_cart", "get_cart"]);
});
