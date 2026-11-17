import { categories, type Concept, type Inventory, type Line, type Product, type Room, type Strategy } from "./types";
import { sofaFit } from "./sofa-decision";

export const money = (cents: number) => new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
}).format(cents / 100);
export const subtotal = (lines: Line[]) => lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
export const remaining = (lines: Line[], budget: number) => budget - subtotal(lines);
export const fits = (product: Product, room: Pick<Room, "width" | "depth" | "sofaSpace">) => {
  const sofa = product.category === "sofa" ? sofaFit(product, room.sofaSpace) : undefined;
  if (sofa === false) return false;
  if (!product.dimensions || !room.width || !room.depth) return sofa;
  const { width, depth } = product.dimensions;
  const w = room.width * 12;
  const d = room.depth * 12;
  return (width <= w && depth <= d) || (depth <= w && width <= d);
};
export const selectable = (p: Product, room: Room) => p.available && fits(p, room) !== false;

export function chooseSofaForRoom(found: Product, candidates: Product[], room: Room) {
  const eligible = candidates.filter(product => selectable(product, room) && product.price <= room.budget);
  const original = eligible.find(product => product.variantId === found.variantId);
  if (original) return original;
  return eligible.sort((a, b) =>
    Number(fits(b, room) === true) - Number(fits(a, room) === true) ||
    Math.abs(a.price - found.price) - Math.abs(b.price - found.price),
  )[0];
}

export function swapLine(lines: Line[], id: string, product: Product): Line[] {
  return lines.map((line) => line.product.variantId === id && product.available &&
    product.category === line.product.category ? { ...line, product } : line);
}

export function alternatives(products: Product[], current: Product, room: Room, strategy: Strategy) {
  const eligible = products.filter((p) => p.variantId !== current.variantId && selectable(p, room));
  if (strategy === "save") return eligible.filter((p) => p.price < current.price).sort((a, b) => a.price - b.price);
  if (strategy === "similar") return eligible.sort((a, b) => Math.abs(a.price - current.price) - Math.abs(b.price - current.price));
  return eligible.sort((a, b) => Number(a.styles.includes(room.style)) - Number(b.styles.includes(room.style)));
}

type Swap = { from: Line; to: Line; savings: number };
export function optimize(lines: Line[], inventory: Inventory, room: Room) {
  const before = subtotal(lines);
  const options = lines.flatMap((line): Swap[] => {
    if (line.locked) return [];
    const best = alternatives(inventory[line.product.category], line.product, room, "save")[0];
    return best ? [{ from: line, to: { ...line, product: best }, savings: (line.product.price - best.price) * line.quantity }] : [];
  }).sort((a, b) => b.savings - a.savings);
  // With one choice per category, taking the largest savings first minimizes the number of changed pieces.
  const changes: Swap[] = [];
  let after = before;
  for (const option of options) {
    if (after <= room.budget) break;
    changes.push(option);
    after -= option.savings;
  }
  return { before, after, changes, fitsBudget: after <= room.budget };
}

export function applyOptimization(lines: Line[], proposal: ReturnType<typeof optimize>): Line[] {
  return lines.map((line) => {
    const change = proposal.changes.find(({ from }) => from.product.variantId === line.product.variantId && from.quantity === line.quantity);
    return !line.locked && change ? { ...line, product: change.to.product } : line;
  });
}

export function merchantGroups(lines: Line[]) {
  const groups = new Map<string, { merchant: string; lines: Line[] }>();
  for (const line of lines) {
    const key = line.product.merchantOrigin ?? line.product.merchant;
    const group = groups.get(key) ?? { merchant: line.product.merchant, lines: [] };
    group.lines.push(line);
    groups.set(key, group);
  }
  return [...groups].map(([id, group]) => ({ id, ...group, total: subtotal(group.lines) }));
}

const tiers = [
  { id: "essentials", name: "Budget Essentials", description: "Everyday staples with the most room left in your budget.", photo: "/images/room-essentials.webp" },
  { id: "balanced", name: "Balanced Comfort", description: "Inviting textures, practical pieces, and a little room to splurge.", photo: "/images/room.webp" },
  { id: "elevated", name: "Elevated Style", description: "Statement pieces and upgraded finishes for a more considered space.", photo: "/images/room-elevated.webp" },
];

export function makeConcepts(inventory: Inventory, room: Room, startingSofa?: Product): Concept[] {
  const lists = categories.map((category) => {
    if (category === "sofa" && startingSofa) return [startingSofa];
    const usable = inventory[category].filter((p) => selectable(p, room));
    const matching = usable.filter((p) => p.styles.includes(room.style));
    return (matching.length >= 3 ? matching : usable).sort((a, b) => a.price - b.price);
  });
  if (lists.some((list) => !list.length)) throw new Error("We couldn’t find an option for every category. Try a different style or check your measurements.");
  const tiersByCategory = lists.map(list => [list[0], list[Math.floor(list.length / 2)], list[list.length - 1]]);
  const concepts = tiers.map((tier, index) => ({
    ...tier,
    lines: tiersByCategory.map(products => ({
      product: products[index], quantity: 1, locked: products[index].variantId === startingSofa?.variantId,
    })),
  }));
  const balanced = concepts[1];
  const adjustment = optimize(balanced.lines, inventory, room);
  if (adjustment.fitsBudget && adjustment.changes.length) {
    const lines = applyOptimization(balanced.lines, adjustment);
    if (lines.some((line, index) => line.product.variantId !== concepts[0].lines[index].product.variantId)) balanced.lines = lines;
  }
  return concepts;
}
