import { Workspace } from "@/components/workspace";
import { DiscoveryFeed } from "@/components/discovery-feed";
import { liveCatalogEnabled } from "@/lib/server/catalog";
import { furnitureFindInput } from "@/lib/server/input";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: {
  searchParams: Promise<{ find?: string; source?: string; platform?: string; setup?: string }>;
}) {
  const { find, source, platform, setup } = await searchParams;
  const inbound = furnitureFindInput.safeParse({ reference: find, source: source ?? "shared", platform });
  if (!inbound.success && !find && setup !== "1") return <DiscoveryFeed />;
  return <Workspace liveEnabled={liveCatalogEnabled()} inbound={inbound.data} />;
}
