import { DiscoveryFeed } from "@/components/discovery-feed";

export default async function DiscoveryDemo({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const { source } = await searchParams;
  const entry = source === "assistant" || source === "shared" ? source : undefined;
  return <DiscoveryFeed entry={entry} />;
}
