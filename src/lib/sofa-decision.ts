import type { Product, Room } from "./types";

export function sofaChecks(product: Product, space: Room["sofaSpace"]) {
  return (["width", "depth"] as const).map(axis => {
    const limit = space?.[axis] || undefined;
    const actual = product.dimensions?.[axis];
    const clearance = limit !== undefined && actual !== undefined ? Math.round((limit - actual) * 10) / 10 : undefined;
    return { axis, limit, actual, clearance };
  });
}

export function sofaFit(product: Product, space: Room["sofaSpace"]) {
  const checks = sofaChecks(product, space);
  if (checks.some(check => check.clearance !== undefined && check.clearance < 0)) return false;
  if (checks.every(check => check.clearance !== undefined && check.clearance >= 0)) return true;
  return undefined;
}
