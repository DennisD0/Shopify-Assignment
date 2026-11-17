import type { SocialPlatform } from "./types";

type BuyerPost = {
  id: string; productId: string; platform: SocialPlatform;
  buyer: string; context: string; topic: string; quote: string;
};

export const demoBuyerPosts: BuyerPost[] = [
  {
    id: "jamie", productId: "demo-sofa-5", platform: "instagram", buyer: "Jamie",
    context: "First apartment · 88-in sofa space", topic: "Small living room",
    quote: "My Marlow fits along an 88-inch wall. I wish I’d left a little more room to walk around the coffee table.",
  },
  {
    id: "sam", productId: "demo-sofa-5", platform: "tiktok", buyer: "Sam",
    context: "Walk-up apartment", topic: "Delivery day",
    quote: "I checked the carton dimensions against my stair landing before ordering the Marlow. That was the tightest turn.",
  },
  {
    id: "morgan", productId: "demo-sofa-3", platform: "instagram", buyer: "Morgan",
    context: "First apartment · 80-in sofa space", topic: "A narrow wall",
    quote: "I picked the Linden for my 80-inch space. At 78 inches wide, it leaves me an inch at each end when centered.",
  },
];

const sampleBuyerCounts: Readonly<Record<string, number>> = { "demo-sofa-5": 50, "demo-sofa-3": 28 };

export function demoBuyerEvidence(productId: string) {
  return { count: sampleBuyerCounts[productId], posts: demoBuyerPosts.filter(post => post.productId === productId) };
}
