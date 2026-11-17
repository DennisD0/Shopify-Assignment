import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../src/app/api/concepts/route";
import { fits } from "../src/lib/budget";
import { sofaFit } from "../src/lib/sofa-decision";
import type { Room, RoomResult } from "../src/lib/types";

const room: Room = {
  photo: "/images/room.webp", style: "Modern Minimalist", budget: 150000,
  width: 0, depth: 0, zip: "", sofaSpace: { width: 78, depth: 40 },
};
const run = (reference: string, space = room.sofaSpace) => POST(new Request("http://localhost/api/concepts", {
  method: "POST",
  body: JSON.stringify({ mode: "demo", room: { ...room, sofaSpace: space }, find: { reference, source: "social", platform: "instagram" } }),
}));

test("non-sofa recommendations stay in their own furniture category and are locked into each concept", async () => {
  for (const [reference, category] of [
    ["Cove Oval Coffee Table", "table"], ["demo-rug-0", "rug"], ["demo-lamp-0", "lamp"], ["demo-storage-1", "storage"],
  ]) {
    const response = await run(reference);
    assert.equal(response.status, 200);
    const { decision, concepts }: RoomResult = await response.json();
    const product = decision?.recommended;
    assert.equal(product?.category, category);
    assert.equal(concepts.length, 3);
    for (const concept of concepts) {
      assert.ok(concept.lines.some(line => line.locked && line.product.variantId === product?.variantId));
    }
  }
});

test("an inbound sofa that exceeds the wall width gets a measured replacement in each room plan", async () => {
  const response = await run("demo-sofa-5");
  assert.equal(response.status, 200);
  const { decision, concepts }: RoomResult = await response.json();
  assert.ok(decision?.recommended);
  assert.equal(decision.match, "exact");
  assert.equal(decision.find.platform, "instagram");
  assert.equal(decision.found.title, "Marlow Low Sofa");
  assert.equal(fits(decision.found, room), false);
  assert.equal(decision.recommended.title, "Linden Track Arm Sofa");
  assert.equal(sofaFit(decision.recommended, room.sofaSpace), true);
  assert.equal(sofaFit(decision.recommended, { width: 78, depth: 0 }), undefined);
  assert.equal(concepts.length, 3);
  assert.ok(concepts.every(concept => concept.lines.some(line =>
    line.locked && line.product.variantId === decision.recommended?.variantId)));
});

test("a pasted recommendation keeps a fitting sofa and a too-small space shows a verdict without a bundle", async () => {
  const fitting: RoomResult = await (await run("Try the Linden Track Arm Sofa for this apartment")).json();
  assert.equal(fitting.decision?.recommended?.variantId, fitting.decision?.found.variantId);
  const tooSmall: RoomResult = await (await run("demo-sofa-5", { width: 25, depth: 40 })).json();
  assert.ok(tooSmall.decision);
  assert.equal(tooSmall.decision.recommended, undefined);
  assert.deepEqual(tooSmall.concepts, []);
});
