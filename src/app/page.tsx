import { Workspace } from "@/components/workspace";
import { DiscoveryFeed } from "@/components/discovery-feed";
import { liveCatalogEnabled } from "@/lib/server/catalog";
import { aiEnabled } from "@/lib/server/ai";
import { sofaFindInput } from "@/lib/server/input";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: {
  searchParams: Promise<{ find?: string; source?: string; platform?: string; setup?: string; start?: string }>;
}) {
  const { find, source, platform, setup, start } = await searchParams;
  const inbound = sofaFindInput.safeParse({ reference: find, source: source ?? "shared", platform });
  if (!inbound.success && !find && setup !== "1") return <DiscoveryFeed />;
  return <Workspace liveEnabled={liveCatalogEnabled()} aiEnabled={aiEnabled()} inbound={inbound.data} openSetup={start === "1"} />;
}
