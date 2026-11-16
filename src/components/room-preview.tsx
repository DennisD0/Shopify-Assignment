import { Images, Layers3, Plus } from "lucide-react";
import type { CSSProperties, Ref } from "react";
import { categoryNames, type Category, type Concept, type Line, type Mode, type Product } from "@/lib/types";

export type RoomView = "furniture" | "inspiration" | "photo";

const views: [RoomView, string][] = [["furniture", "Furniture preview"], ["inspiration", "Inspiration"], ["photo", "Room photo"]];
const inspirationHotspots: Record<string, Record<Category, [number, number]>> = {
  essentials: { sofa: [36, 53], rug: [75, 87], table: [49, 69], lamp: [9, 32], storage: [83, 57] },
  balanced: { sofa: [54, 57], rug: [73, 85], table: [53, 72], lamp: [36, 28], storage: [91, 60] },
  elevated: { sofa: [70, 47], rug: [79, 84], table: [55, 65], lamp: [87, 21], storage: [16, 55] },
};
const furnitureHotspots: Record<Category, [number, number]> = {
  sofa: [45, 56], rug: [73, 88], table: [51, 77], lamp: [20, 46], storage: [81, 66],
};
const catalogHotspots: Record<Category, [number, number]> = {
  sofa: [29, 24], table: [59, 24], rug: [89, 24], lamp: [44, 58], storage: [74, 58],
};
const catalogWidths: Record<Category, number> = { sofa: 82, table: 43, rug: 72, lamp: 17, storage: 56 };

export function furnitureCutout(product: Product) {
  const prefix = `demo-${product.category}-`;
  const index = product.id.slice(prefix.length);
  // Existing demo drafts have the same IDs and can use the cutouts after a reload.
  return product.id.startsWith(prefix) && /^[0-5]$/.test(index) ? `/images/furniture-preview/${product.category}-${index}.webp` : undefined;
}

function FurnitureLayer({ product, mode }: { product: Product; mode: Mode }) {
  const cutout = mode === "demo" ? furnitureCutout(product) : undefined;
  const width = product.dimensions?.width ?? catalogWidths[product.category];
  const scale = Math.max(0.8, Math.min(1.16, width / catalogWidths[product.category]));
  const flatRug = cutout && product.category === "rug" && /[3-5]$/.test(product.id);
  return <div className={`furniture-layer furniture-layer-${product.category}${cutout ? "" : " catalog-layer"}`}
    style={{ "--piece-scale": scale } as CSSProperties}>
    <img className={flatRug ? "rug-perspective" : undefined} src={cutout ?? product.image} alt={product.title} />
  </div>;
}

export function RoomPreview({ concept, lines, photo, mode, view, onView, onSelect, previewRef }: {
  concept: Concept; lines: Line[]; photo: string; mode: Mode; view: RoomView;
  onView: (view: RoomView) => void; onSelect: (id: string) => void; previewRef: Ref<HTMLElement>;
}) {
  const furniture = view === "furniture";
  const catalog = furniture && mode === "live";
  const hotspots = catalog ? catalogHotspots : furniture ? furnitureHotspots : inspirationHotspots[concept.id] ?? inspirationHotspots.balanced;
  const caption = furniture
    ? catalog ? "Catalog collage · Current product photos" : "Furniture preview · Approximate scale and placement"
    : view === "photo" ? "Reference photo" : "Inspiration photo · Furniture shown may differ from your picks";
  return <figure ref={previewRef} tabIndex={-1} className="room-preview" aria-label={furniture ? "Current furniture preview" : undefined}>
    {furniture ? <div className={`furniture-stage${catalog ? " catalog-stage" : ""}`}>
      {!catalog && <img className="stage-backdrop" src="/images/furniture-preview/empty-room.webp" alt="" />}
      {lines.map(({ product }) => <FurnitureLayer key={product.variantId} mode={mode} product={product} />)}
    </div> : <img src={view === "photo" ? photo : concept.photo} alt={view === "photo" ? "Your reference room" : `${concept.name} furnished room inspiration`} />}
    <div className="room-image-actions" role="group" aria-label="Room view">
      {views.map(([id, label]) => <button type="button" key={id} aria-pressed={view === id} onClick={() => onView(id)}>{label}</button>)}
    </div>
    {view !== "photo" && lines.map(({ product }) => <button type="button" key={product.category} className="hotspot"
      style={{ left: `${hotspots[product.category][0]}%`, top: `${hotspots[product.category][1]}%` }}
      title={product.title} aria-label={`Explore ${categoryNames[product.category].toLowerCase()} options`} onClick={() => onSelect(product.variantId)}><Plus size={19} /></button>)}
    <figcaption>{furniture ? <Layers3 size={15} /> : <Images size={15} />} {caption}</figcaption>
  </figure>;
}
