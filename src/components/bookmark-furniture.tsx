"use client";

import { Bookmark } from "lucide-react";
import { useSavedFurniture } from "@/lib/saved-furniture";
import type { SocialPlatform } from "@/lib/types";

export function BookmarkFurniture({ productId, name, platform }: { productId: string; name: string; platform: SocialPlatform }) {
  const saved = useSavedFurniture(state => Boolean(state.saved[productId]));
  const toggle = useSavedFurniture(state => state.toggle);
  return <button className="bookmark-furniture" type="button" aria-label={`Save ${name}`} aria-pressed={saved}
    onClick={() => toggle(productId, platform)}><Bookmark size={18} fill={saved ? "currentColor" : "none"} aria-hidden="true" /></button>;
}
