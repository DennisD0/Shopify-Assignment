import type { SocialPlatform } from "./types";

type BuyerPost = {
  id: string; productId: string; platform: SocialPlatform;
  buyer: string; context: string; topic: string; quote: string;
  delivery?: { method: "standard" | "express"; quotedDays: number; arrivedDays: number };
};

export const demoBuyerPosts: BuyerPost[] = [
  {
    id: "jamie", productId: "demo-sofa-5", platform: "instagram", buyer: "Jamie",
    context: "First apartment · 88-in sofa space", topic: "Small living room",
    quote: "My Marlow fits along an 88-inch wall. I wish I’d left a little more room to walk around the coffee table.",
    delivery: { method: "standard", quotedDays: 7, arrivedDays: 9 },
  },
  {
    id: "ria", productId: "demo-table-1", platform: "reddit", buyer: "Ria",
    context: "First rental · Furnishing in stages", topic: "The coffee table could wait",
    quote: "I put the coffee table in next month’s budget. Once the seating was in, I measured the walkway and chose the oval Cove.",
    delivery: { method: "standard", quotedDays: 8, arrivedDays: 6 },
  },
  {
    id: "theo", productId: "demo-rug-0", platform: "instagram", buyer: "Theo",
    context: "First apartment · Living room", topic: "A rug for the seating area",
    quote: "I taped the rug size on the floor first. Seeing the border in the room helped me choose the smaller size.",
    delivery: { method: "express", quotedDays: 4, arrivedDays: 4 },
  },
  {
    id: "imani", productId: "demo-lamp-0", platform: "youtube", buyer: "Imani",
    context: "Studio apartment · Move-in week", topic: "Lighting came first",
    quote: "The room had no overhead light, so the floor lamp was one of my first purchases. I waited on the media console.",
    delivery: { method: "standard", quotedDays: 7, arrivedDays: 7 },
  },
  {
    id: "lee", productId: "demo-storage-1", platform: "x", buyer: "Lee",
    context: "Shared apartment · Living room", topic: "Measuring for the media console",
    quote: "I checked the console depth with the cables plugged in. That extra inch made a difference near the door.",
    delivery: { method: "express", quotedDays: 5, arrivedDays: 6 },
  },
  {
    id: "sam", productId: "demo-sofa-5", platform: "tiktok", buyer: "Sam",
    context: "Walk-up apartment", topic: "Delivery day",
    quote: "I checked the carton dimensions against my stair landing before ordering the Marlow. That was the tightest turn.",
    delivery: { method: "express", quotedDays: 4, arrivedDays: 3 },
  },
  {
    id: "morgan", productId: "demo-sofa-3", platform: "instagram", buyer: "Morgan",
    context: "First apartment · 80-in sofa space", topic: "A narrow wall",
    quote: "I picked the Linden for my 80-inch space. At 78 inches wide, it leaves me an inch at each end when centered.",
    delivery: { method: "standard", quotedDays: 8, arrivedDays: 7 },
  },
  {
    id: "nina", productId: "demo-sofa-5", platform: "instagram", buyer: "Nina",
    context: "Rental apartment · Narrow doorway", topic: "Getting it through the door",
    quote: "I measured the doorway with the door fully open and compared it with the carton dimensions. The door handle was the part I almost forgot.",
  },
  {
    id: "alex", productId: "demo-sofa-3", platform: "reddit", buyer: "Alex",
    context: "Apartment living room · One month in", topic: "Living with a shallow sofa",
    quote: "The Linden left me room to walk past the coffee table. I sit upright most of the time, so the shallower seat works for me.",
  },
  {
    id: "priya", productId: "demo-sofa-0", platform: "youtube", buyer: "Priya",
    context: "Studio apartment · Room tour", topic: "Furnishing a studio",
    quote: "The Haven fit beside my desk. In my room tour, I show how much space I left to pull the desk chair out.",
    delivery: { method: "express", quotedDays: 5, arrivedDays: 4 },
  },
  {
    id: "jules", productId: "demo-sofa-4", platform: "x", buyer: "Jules",
    context: "First rental · Shared living room", topic: "Marking the sofa footprint",
    quote: "I taped out the Alder’s footprint before ordering. Moving it a few inches away from the corner kept the outlet accessible.",
    delivery: { method: "express", quotedDays: 3, arrivedDays: 2 },
  },
  {
    id: "marin", productId: "demo-table-3", platform: "instagram", buyer: "Marin",
    context: "First rental · Living room", topic: "Saving for a coffee table",
    quote: "I waited until my second paycheck and used a tray in the meantime. The table arrived a day before the quoted deadline.",
    delivery: { method: "standard", quotedDays: 8, arrivedDays: 7 },
  },
  {
    id: "robin", productId: "demo-rug-3", platform: "reddit", buyer: "Robin",
    context: "Studio apartment · Move-in week", topic: "A rug that arrived early",
    quote: "I ordered the rug first so I could lay it down before the heavier furniture arrived.",
    delivery: { method: "standard", quotedDays: 7, arrivedDays: 5 },
  },
  {
    id: "eden", productId: "demo-lamp-3", platform: "youtube", buyer: "Eden",
    context: "Rental apartment · Reading corner", topic: "A light for the first week",
    quote: "The lamp was the only piece I paid to ship express. It let me use the reading corner on move-in night.",
    delivery: { method: "express", quotedDays: 3, arrivedDays: 3 },
  },
  {
    id: "kai", productId: "demo-storage-3", platform: "tiktok", buyer: "Kai",
    context: "Shared apartment · Little storage", topic: "Making space for the console",
    quote: "The console took longer than quoted, so we kept the boxes along the wall for a few extra days.",
    delivery: { method: "standard", quotedDays: 10, arrivedDays: 12 },
  },
  {
    id: "sol", productId: "demo-table-4", platform: "x", buyer: "Sol",
    context: "Small living room · Temporary workspace", topic: "Two tables for a small space",
    quote: "I can slide the smaller table away when I need the floor space. Standard shipping fit my budget.",
    delivery: { method: "standard", quotedDays: 8, arrivedDays: 8 },
  },
  {
    id: "andi", productId: "demo-rug-4", platform: "instagram", buyer: "Andi",
    context: "Rental apartment · Shared living room", topic: "Ordering around the furniture delivery",
    quote: "I measured the seating area and ordered the rug once I knew when our other furniture would arrive.",
    delivery: { method: "standard", quotedDays: 7, arrivedDays: 8 },
  },
  {
    id: "dev", productId: "demo-storage-4", platform: "reddit", buyer: "Dev",
    context: "First apartment · Week two", topic: "Storage after move-in",
    quote: "I used a moving box as a media stand for the first week. The console arrived within the quoted window.",
    delivery: { method: "standard", quotedDays: 9, arrivedDays: 8 },
  },
];

const sampleBuyerCounts: Readonly<Record<string, number>> = {
  "demo-table-1": 24,
  "demo-rug-0": 32,
  "demo-lamp-0": 21,
  "demo-storage-1": 18,
  "demo-table-3": 19,
  "demo-rug-3": 27,
  "demo-lamp-3": 18,
  "demo-storage-3": 16,
  "demo-table-4": 22,
  "demo-rug-4": 24,
  "demo-storage-4": 17,
  "demo-sofa-5": 50,
  "demo-sofa-3": 28,
  "demo-sofa-0": 36,
  "demo-sofa-4": 19,
};

export function demoBuyerEvidence(productId: string) {
  return {
    count: sampleBuyerCounts[productId], likes: sampleLikes[productId],
    posts: demoBuyerPosts.filter(post => post.productId === productId),
  };
}

const sampleLikes: Readonly<Partial<Record<string, number>>> = {
  "demo-sofa-0": 75, "demo-sofa-3": 62, "demo-sofa-4": 41, "demo-sofa-5": 112,
  "demo-table-1": 64, "demo-table-3": 47, "demo-table-4": 53,
  "demo-rug-0": 81, "demo-rug-3": 59, "demo-rug-4": 48,
  "demo-lamp-0": 42, "demo-lamp-3": 37,
  "demo-storage-1": 45, "demo-storage-3": 28, "demo-storage-4": 38,
};

const coLikes: Array<[first: string, second: string, shoppers: number]> = [
  ["demo-sofa-5", "demo-sofa-3", 26], ["demo-sofa-5", "demo-sofa-0", 19], ["demo-sofa-0", "demo-sofa-4", 13],
  ["demo-table-1", "demo-table-3", 21], ["demo-table-1", "demo-table-4", 17],
  ["demo-rug-0", "demo-rug-3", 24], ["demo-rug-0", "demo-rug-4", 15],
  ["demo-lamp-0", "demo-lamp-3", 14],
  ["demo-storage-1", "demo-storage-4", 12], ["demo-storage-1", "demo-storage-3", 9],
];

export function sharedLikes(first: string, second: string) {
  return coLikes.find(([a, b]) => (first === a && second === b) || (first === b && second === a))?.[2] ?? 0;
}
