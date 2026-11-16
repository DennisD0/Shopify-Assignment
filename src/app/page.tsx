import { Workspace } from "@/components/workspace";
import { liveCatalogEnabled } from "@/lib/server/catalog";
import { aiEnabled } from "@/lib/server/ai";

export const dynamic = "force-dynamic";

export default function Home() {
  return <Workspace liveEnabled={liveCatalogEnabled()} aiEnabled={aiEnabled()} />;
}
