export const demoDeliveryOptions = ["standard", "express"] as const;
export type DemoDeliveryOption = (typeof demoDeliveryOptions)[number];
export type DemoDeliveryQuote = {
  id: DemoDeliveryOption;
  label: string;
  minDays: number;
  maxDays: number;
  price: number;
};

const profiles: Record<string, { zone: number; standard: number; express: number; leadDays: number }> = {
  "Merchant 1": { zone: 1, standard: 2400, express: 4900, leadDays: 0 },
  "Merchant 2": { zone: 6, standard: 1900, express: 3900, leadDays: 1 },
  "Merchant 3": { zone: 9, standard: 2900, express: 5900, leadDays: 0 },
  "Merchant 4": { zone: 1, standard: 2100, express: 4600, leadDays: 1 },
  "Merchant 5": { zone: 3, standard: 1700, express: 4300, leadDays: 0 },
  "Merchant 6": { zone: 2, standard: 2600, express: 5200, leadDays: 0 },
  "Merchant 7": { zone: 8, standard: 2800, express: 5700, leadDays: 2 },
  "Merchant 8": { zone: 0, standard: 1500, express: 4200, leadDays: 1 },
  "Merchant 9": { zone: 4, standard: 2200, express: 4700, leadDays: 0 },
  "Merchant 10": { zone: 7, standard: 2500, express: 5400, leadDays: 1 },
};
const defaultProfile = profiles["Merchant 1"];

export function quoteDemoDelivery(merchant: string, zip: string): Record<DemoDeliveryOption, DemoDeliveryQuote> {
  const { zone, standard, express, leadDays } = profiles[merchant] ?? defaultProfile;
  // Synthetic ZIP zones let Demo Mode show how a delivery destination affects the window.
  const crossZone = zip && Math.abs(Number(zip[0]) - zone) >= 4 ? 1 : 0;
  const rangeAllowance = zip ? 0 : 1;
  return {
    standard: { id: "standard", label: "Standard", minDays: 4 + leadDays + crossZone, maxDays: 7 + leadDays + crossZone + rangeAllowance, price: standard },
    express: { id: "express", label: "Express", minDays: 1 + leadDays + crossZone, maxDays: 3 + leadDays + crossZone + rangeAllowance, price: express },
  };
}

export function deliveryWindow({ minDays, maxDays }: DemoDeliveryQuote) {
  return `${minDays}–${maxDays} business days`;
}
