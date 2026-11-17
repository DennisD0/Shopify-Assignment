import { z } from "zod";
import { merchantGroups } from "@/lib/budget";
import { demoInventory } from "@/lib/demo";
import { quoteDemoDelivery } from "@/lib/demo-delivery";
import { buildFurnishingPlan, deliveryReports } from "@/lib/furnishing-plan";
import { explainFurnishingPlan } from "@/lib/server/ai";
import { categoryInput, zipInput } from "@/lib/server/input";

const schema = z.object({
  lines: z.array(z.object({ id: z.string(), category: categoryInput, locked: z.boolean(), quantity: z.number().int().min(1).max(20) })).min(1).max(5),
  priority: categoryInput,
  budget: z.number().int().min(1).max(10_000_000),
  laterBudget: z.number().int().min(0).max(10_000_000),
  days: z.number().int().min(0).max(262),
  room: z.object({
    width: z.number().min(0).max(100), depth: z.number().min(0).max(100), zip: zipInput,
    sofaSpace: z.object({ width: z.number().min(0).max(300), depth: z.number().min(0).max(300) }).optional(),
  }),
});

export async function POST(request: Request) {
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Check the budget, date and ZIP code." }, { status: 400 });

  const { lines, room, priority, budget, laterBudget, days } = input.data;
  const products = lines.flatMap(line => {
    const product = demoInventory[line.category].find(item => item.variantId === line.id);
    return product ? [{ product, locked: line.locked, quantity: line.quantity }] : [];
  });
  if (products.length !== lines.length || new Set(lines.map(line => line.category)).size !== lines.length) {
    return Response.json({ error: "Use a room plan from the demo catalog." }, { status: 400 });
  }

  const plans = buildFurnishingPlan(products, room, priority, budget, days);
  const evidence = plans.map(plan => ({
    label: plan.label, totalBeforeTaxCents: plan.total, latestBusinessDays: plan.latest, nextPhaseCents: plan.laterTotal,
    deferredItems: plan.later.map(line => line.product.title),
    merchants: merchantGroups(plan.now).map(group => {
      const method = plan.deliveries[group.id];
      const reports = deliveryReports(group.merchant, method);
      return {
        merchant: group.merchant, items: group.lines.map(line => line.product.title), quote: quoteDemoDelivery(group.merchant, room.zip)[method],
        sampleReports: reports.map(({ quotedDays, arrivedDays }) => ({ quotedDays, arrivedDays })),
      };
    }),
  }));
  const note = plans.length ? await explainFurnishingPlan({ days, budgetCents: budget, nextPhaseBudgetCents: laterBudget, plans: evidence }) : undefined;
  return Response.json({ plans, note });
}
