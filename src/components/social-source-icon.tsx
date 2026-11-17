import { siInstagram, siReddit, siTiktok, siX, siYoutube } from "simple-icons";
import type { SocialPlatform } from "@/lib/types";

const icons = { instagram: siInstagram, tiktok: siTiktok, reddit: siReddit, youtube: siYoutube, x: siX };

export function SocialSourceIcon({ platform, size }: { platform: SocialPlatform; size: number }) {
  const icon = icons[platform];
  return <svg className="social-source-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d={icon.path} fill={platform === "instagram" ? "#262626" : `#${icon.hex}`} />
  </svg>;
}
