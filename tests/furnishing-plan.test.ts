import assert from "node:assert/strict";
import test from "node:test";
import { makeConcepts } from "../src/lib/budget";
import { demoInventory } from "../src/lib/demo";
import { businessDaysUntil, buildFurnishingPlan } from "../src/lib/furnishing-plan";
import type { Room } from "../src/lib/types";

const room: Room = {
  photo: "", width: 0, depth: 0, zip: "10001", style: "Modern Minimalist",
  budget: 150000, sofaSpace: { width: 80, depth: 40 },
};
const essentials = makeConcepts(demoInventory, room, demoInventory.sofa[0])[0].lines;

test("furnishing phases compare shipping-inclusive totals and preserve the locked priority", () => {
  const [lowest, earliest] = buildFurnishingPlan(essentials, room, "sofa", 80000, 10);
  assert.deepEqual([lowest.total, lowest.latest, earliest.total, earliest.latest], [69500, 9, 74500, 5]);
  assert.equal(earliest.laterTotal, 28200);
  for (const plan of [lowest, earliest]) {
    assert.equal(plan.now.find(line => line.locked)?.product.id, demoInventory.sofa[0].id);
    assert.equal(plan.now.length + plan.later.length, essentials.length);
  }
});

test("a plan requires enough budget and time for the priority furniture", () => {
  assert.deepEqual(buildFurnishingPlan(essentials, room, "sofa", 49900, 10), []);
  assert.deepEqual(buildFurnishingPlan(essentials, room, "sofa", 80000, 1), []);
  assert.equal(businessDaysUntil("2026-11-20", "2026-11-23"), 1);
});
