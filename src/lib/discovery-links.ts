import type { DiscoverySource, SocialPlatform, FurnitureFind } from "./types";

export const discoverySourceLabels: Record<DiscoverySource, string> = {
  assistant: "AI assistant",
  social: "Social post",
  shared: "Shared conversation",
};

export const platformLabels: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  reddit: "Reddit",
  youtube: "YouTube",
  x: "X",
};

export function findSourceLabel(find: FurnitureFind) {
  return find.source === "social" && find.platform ? platformLabels[find.platform] : discoverySourceLabels[find.source];
}

export function furnitureFindPath(reference: string, source: DiscoverySource, platform?: SocialPlatform) {
  const params = new URLSearchParams({ find: reference, source });
  if (source === "social" && platform) params.set("platform", platform);
  return `/?${params}`;
}
