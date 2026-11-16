import test from "node:test";
import assert from "node:assert/strict";
import { alternatives, applyOptimization, fits, makeConcepts, merchantGroups, money, optimize, remaining, subtotal, swapLine } from "../src/lib/budget";
import { demoInventory } from "../src/lib/demo";
import type { Line, Room } from "../src/lib/types";

const room: Room = { photo: "/images/room.webp", style: "Modern Minimalist", budget: 150000, width: 0, depth: 0, zip: "" };
const line = (category: keyof typeof demoInventory, index: number, quantity = 1, locked = false): Line =>
  ({ product: demoInventory[category][index], quantity, locked });

test("budget and quantities use integer cents", () => {
  const table = line("table", 1, 2);
  const selection = [line("sofa", 1), { ...table, product: { ...table.product, price: 19999 } }];
  assert.equal(subtotal(selection), 109898);
  assert.equal(remaining(selection, 100000), -9898);
  assert.equal(money(9898), "$98.98");
});

test("switching an offer preserves all unrelated lines and the selected quantity", () => {
  const sofa = line("sofa", 1);
  const table = line("table", 1, 2);
  const products = [sofa, table];
  const swapped = swapLine(products, table.product.variantId, demoInventory.table[0]);
  assert.equal(swapped[0], sofa);
  assert.equal(swapped[1].quantity, 2);
  assert.equal(subtotal(swapped) - subtotal(products), -18000);
  assert.equal(swapLine(products, table.product.variantId, demoInventory.rug[0])[1], table);
  assert.equal(swapLine(products, table.product.variantId, { ...demoInventory.table[0], available: false })[1], table);
});

test("similar and cheaper modes use actual price differences and valid footprints", () => {
  const sofa = demoInventory.sofa[1];
  assert.equal(alternatives(demoInventory.sofa, sofa, room, "similar")[0].title, "Marlow Low Sofa");
  assert.deepEqual(alternatives(demoInventory.sofa, sofa, { ...room, width: 6, depth: 4 }, "save").map(p => p.title), ["Haven Apartment Sofa"]);
  assert.equal(fits(sofa, { width: 4, depth: 7 }), true);
  assert.equal(fits({ ...sofa, dimensions: undefined }, room), undefined);
});

test("the budget plan preserves a locked sofa and requires explicit application", () => {
  const sofa = line("sofa", 1, 1, true);
  const initial = [sofa, line("table", 2), line("rug", 1), line("lamp", 1), line("storage", 1)];
  const plan = optimize(initial, demoInventory, room);
  assert.equal(subtotal(initial), 160500);
  assert.equal(plan.before, 160500);
  assert.equal(plan.after, 135500);
  assert.equal(plan.changes.length, 1);
  assert.equal(plan.changes[0].from.product.category, "table");
  assert.equal(plan.fitsBudget, true);
  const applied = applyOptimization(initial, plan);
  assert.equal(applied[0], sofa);
  assert.equal(subtotal(applied), plan.after);
  const lockedAfterPreview = initial.map(item => ({ ...item, locked: true }));
  assert.deepEqual(applyOptimization(lockedAfterPreview, plan), lockedAfterPreview);
});

test("impossible budgets report the available floor and never substitute locked items", () => {
  const locked = [line("sofa", 2, 1, true), line("table", 2, 1, true)];
  const impossible = optimize(locked, demoInventory, { ...room, budget: 100000 });
  assert.equal(impossible.fitsBudget, false);
  assert.equal(impossible.after, subtotal(locked));
  assert.deepEqual(impossible.changes, []);
  const affordable = optimize([line("sofa", 0)], demoInventory, room);
  assert.equal(affordable.fitsBudget, true);
  assert.deepEqual(affordable.changes, []);
});

test("each concept has five purchasable records and deterministic pricing", () => {
  const concepts = makeConcepts(demoInventory, room);
  assert.equal(concepts.length, 3);
  assert.deepEqual(concepts.map(c => subtotal(c.lines)), [90500, 149500, 227500]);
  assert.ok(concepts.every(c => new Set(c.lines.map(({ product }) => product.category)).size === 5));
  assert.deepEqual(makeConcepts(demoInventory, room), concepts);
  const budgetRoom = { ...room, budget: 130000 };
  assert.ok(subtotal(makeConcepts(demoInventory, budgetRoom)[1].lines) <= budgetRoom.budget);
});

test("merchant groups use the storefront origin and sum each merchant independently", () => {
  const a = line("sofa", 1);
  const b = line("table", 0, 2);
  const c = line("rug", 1);
  const groups = merchantGroups([a, b, c]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].total, 91700);
  assert.equal(groups[1].total, 16900);
  const other = { ...b, product: { ...b.product, merchant: a.product.merchant, merchantOrigin: "https://other.myshopify.com" } };
  assert.equal(merchantGroups([a, other]).length, 2);
});
