import { categories, styles, type Category, type Inventory, type Product } from "./types";

type Sample = [title: string, price: number, finish: string, width: number, depth: number];
const samples: Record<Category, Sample[]> = {
  sofa: [
    ["Haven Apartment Sofa", 499, "Oat linen", 72, 33],
    ["August Linen Sofa", 699, "Natural linen", 82, 35],
    ["Palisade Modular Sofa", 999, "Ivory bouclé", 92, 39],
    ["Linden Track Arm Sofa", 639, "Warm sand", 78, 34],
    ["Alder Studio Sofa", 549, "Moss weave", 74, 33],
    ["Marlow Low Sofa", 749, "Pebble twill", 84, 37],
  ],
  table: [
    ["Ashford Round Table", 109, "Light ash", 30, 30],
    ["Cove Oval Coffee Table", 199, "Natural oak", 44, 24],
    ["Forma Travertine Table", 359, "Honed travertine", 47, 27],
    ["Finn Slatted Table", 179, "Honey oak", 38, 22],
    ["Isla Nesting Tables", 139, "Smoked oak", 34, 22],
    ["Dune Pebble Table", 219, "Sandstone", 40, 27],
  ],
  rug: [
    ["Milo Flatweave Rug", 89, "Natural / 5 × 7 ft", 60, 84],
    ["Aster Textured Rug", 169, "Ivory / 6 × 9 ft", 72, 108],
    ["Sable Handwoven Rug", 289, "Dune / 8 × 10 ft", 96, 120],
    ["Noma Low Pile Rug", 149, "Flax / 6 × 9 ft", 72, 108],
    ["Vale Herringbone Rug", 119, "Oat / 5 × 7 ft", 60, 84],
    ["Riviera Loop Rug", 189, "Stone / 6 × 9 ft", 72, 108],
  ],
  lamp: [
    ["Sora Task Floor Lamp", 59, "Matte black", 12, 16],
    ["Orla Arc Floor Lamp", 129, "Brushed brass", 17, 26],
    ["Nami Linen Floor Lamp", 189, "Natural linen", 21, 21],
    ["Reed Reading Lamp", 109, "Soft white", 14, 18],
    ["Juniper Globe Lamp", 79, "Antique brass", 13, 13],
    ["Elsa Tripod Lamp", 149, "Natural ash", 21, 21],
  ],
  storage: [
    ["Oslo Low Media Unit", 149, "Light oak", 44, 15],
    ["Rowan Media Console", 249, "Walnut", 56, 17],
    ["Emery Tambour Console", 439, "Smoked walnut", 67, 18],
    ["Nook Sliding Console", 219, "Natural ash", 51, 16],
    ["Piper Open Media Unit", 179, "White oak", 47, 15],
    ["Arden Cabinet", 279, "Deep teak", 56, 18],
  ],
};

const merchants = ["Merchant 2", "Merchant 1", "Merchant 3"];
const featuredMerchants: Readonly<Partial<Record<string, string>>> = {
  "demo-table-3": "Merchant 4",
  "demo-rug-3": "Merchant 5",
  "demo-lamp-3": "Merchant 6",
  "demo-storage-3": "Merchant 7",
  "demo-table-4": "Merchant 8",
  "demo-rug-4": "Merchant 9",
  "demo-storage-4": "Merchant 10",
};
const lowStock = new Set(["demo-sofa-2", "demo-table-2", "demo-rug-2", "demo-lamp-5", "demo-storage-5"]);
const availableToOrder = new Set(["demo-sofa-4", "demo-table-5", "demo-rug-5", "demo-lamp-2", "demo-storage-2"]);

export function demoStockStatus(id: string) {
  if (lowStock.has(id)) return "low_stock";
  if (availableToOrder.has(id)) return "available_to_order";
  return "in_stock";
}

export const demoInventory: Inventory = Object.fromEntries(categories.map((category, categoryIndex) => [
  category,
  samples[category].map(([title, price, variant, width, depth], i): Product => ({
    id: `demo-${category}-${i}`, variantId: `demo-${category}-${i}-variant`, category, title,
    variant, price: price * 100, merchant: featuredMerchants[`demo-${category}-${i}`] ?? merchants[(i + categoryIndex) % merchants.length],
    image: `/images/${category}-${i}.webp`, styles: i < 3 ? [...styles] : [styles[(i + categoryIndex) % 3]],
    available: true, dimensions: { width, depth },
  })),
])) as Inventory;

export const demoProducts = Object.values(demoInventory).flat();
