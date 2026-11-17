import { fits, merchantGroups } from "./budget";
import { demoInventory, demoProducts, demoStockStatus } from "./demo";
import { demoBuyerPosts } from "./demo-buyer-stories";
import { demoDeliveryOptions, quoteDemoDelivery, type DemoDeliveryOption } from "./demo-delivery";
import type { Category, Line, Room } from "./types";

type Purchase = {
  ids: string[];
  total: number;
  latest: number;
  deliveries: Record<string, DemoDeliveryOption>;
};

export function deliveryReports(merchant: string, method: DemoDeliveryOption) {
  return demoBuyerPosts.flatMap(post =>
    post.delivery?.method === method && demoProducts.some(product => product.id === post.productId && product.merchant === merchant)
      ? [{ id: post.id, buyer: post.buyer, platform: post.platform, ...post.delivery }]
      : [],
  );
}

export function merchantDeliveryAverages(merchant: string) {
  return demoDeliveryOptions.flatMap(method => {
    const reports = deliveryReports(merchant, method);
    return reports.length ? [{
      label: method === "express" ? "Express" : "Standard",
      count: reports.length,
      days: reports.reduce((total, report) => total + report.arrivedDays, 0) / reports.length,
    }] : [];
  });
}

export function businessDaysUntil(today: string, deadline: string) {
  const start = Date.parse(today);
  const end = Date.parse(deadline);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start || end - start > 366 * 86400000) return -1;
  let total = 0;
  for (let day = start + 86400000; day <= end; day += 86400000) {
    const weekday = new Date(day).getUTCDay();
    if (weekday !== 0 && weekday !== 6) total++;
  }
  return total;
}

function purchaseOptions(lines: Line[], zip: string): Purchase[] {
  const initial: Purchase = { ids: lines.map(line => line.product.variantId), total: 0, latest: 0, deliveries: {} };
  return merchantGroups(lines).reduce((options, group) => {
    const quotes = quoteDemoDelivery(group.merchant, zip);
    return options.flatMap(option => demoDeliveryOptions.map(method => ({
      ...option,
      total: option.total + group.total + quotes[method].price,
      latest: Math.max(option.latest, quotes[method].maxDays),
      deliveries: { ...option.deliveries, [group.id]: method },
    })));
  }, [initial]);
}

export function buildFurnishingPlan(lines: Line[], room: Pick<Room, "width" | "depth" | "sofaSpace" | "zip">, priority: Category, budget: number, days: number) {
  const first = lines.find(line => line.product.category === priority);
  if (!first) return [];
  const canBuyNow = (product: Line["product"]) => product.available &&
    demoStockStatus(product.id) !== "available_to_order" && fits(product, room) !== false;
  const alternatives = first.locked ? [first.product] : [
    first.product,
    ...demoInventory[priority].filter(product => product.merchant !== first.product.merchant),
  ];
  const others = lines.filter(line => line !== first && canBuyNow(line.product));
  const subsets = others.reduce<Line[][]>((sets, line) => [...sets, ...sets.map(set => [...set, line])], [[]]);
  const candidates = alternatives.filter(canBuyNow).flatMap(product => subsets.flatMap(subset =>
    purchaseOptions([{ ...first, product }, ...subset], room.zip)
      .filter(option => option.total <= budget && option.latest <= days)
      .map(option => ({ ...option, priorityId: product.variantId })),
  ));
  const mostItems = Math.max(0, ...candidates.map(option => option.ids.length));
  const eligible = candidates.filter(option => option.ids.length === mostItems);
  const cheapest = [...eligible].sort((a, b) => a.total - b.total || a.latest - b.latest)[0];
  const fastest = [...eligible].sort((a, b) => a.latest - b.latest || a.total - b.total)[0];
  const choices = cheapest ? (cheapest === fastest ? [cheapest] : [cheapest, fastest]) : [];

  return choices.map((choice, index) => {
    const product = alternatives.find(candidate => candidate.variantId === choice.priorityId) ?? first.product;
    const planned = lines.map(line => line === first ? { ...line, product } : line);
    const now = planned.filter(line => choice.ids.includes(line.product.variantId));
    const later = planned.filter(line => !choice.ids.includes(line.product.variantId));
    const laterTotal = merchantGroups(later).reduce((total, group) =>
      total + group.total + quoteDemoDelivery(group.merchant, room.zip).standard.price, 0);
    return {
      ...choice, now, later, laterTotal,
      label: choices.length === 1 ? "Recommended plan" : index === 0 ? "Lowest total" : "Earliest arrival",
    };
  });
}
