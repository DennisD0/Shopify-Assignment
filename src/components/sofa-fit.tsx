"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Link2, Ruler } from "lucide-react";
import { fits, money } from "@/lib/budget";
import { demoBuyerEvidence } from "@/lib/demo-buyer-stories";
import { findSourceLabel, platformLabels, sofaFindPath } from "@/lib/discovery-links";
import { sofaChecks, sofaFit } from "@/lib/sofa-decision";
import type { Mode, Product, Room, SofaDecision } from "@/lib/types";
import { furnitureCutout } from "./room-preview";
import { Button } from "./ui";

function FitChecks({ product, room }: { product: Product; room: Room }) {
  return <dl className="fit-checks">
    {sofaChecks(product, room.sofaSpace).map(({ axis, limit, actual, clearance }) => <div key={axis}>
      <dt>{axis === "width" ? "Usable width" : "Usable depth"}</dt>
      <dd>{actual === undefined ? "Product measurement unavailable" : limit === undefined ? `${actual} in · Add your measurement` : `${actual} in sofa / ${limit} in space`}</dd>
      {clearance !== undefined && <dd className={clearance < 0 ? "over" : "under"}>{clearance < 0 ? `${Math.abs(clearance)} in too ${axis === "width" ? "wide" : "deep"}` : `${clearance} in to spare`}</dd>}
    </div>)}
  </dl>;
}

function fitVerdict(product: Product, room: Room) {
  if (!product.available) return { label: "Unavailable", tone: "over" };
  if (fits(product, room) === false) return { label: "Exceeds your space", tone: "over" };
  if (sofaFit(product, room.sofaSpace) === true) return { label: "Fits your measurements", tone: "under" };
  return { label: "Fit still to verify", tone: "muted" };
}

function SofaCard({ product, room, label }: { product: Product; room: Room; label: string }) {
  const verdict = fitVerdict(product, room);
  return <article className="fit-card">
    <div className="fit-card-product">
      <img src={furnitureCutout(product) ?? product.image} alt="" />
      <div><small>{label}</small><h3>{product.title}</h3><p>{money(product.price)} · {product.merchant}</p></div>
    </div>
    <strong className={verdict.tone}>{verdict.label}</strong>
    <FitChecks product={product} room={room} />
    {product.price > room.budget && <p className="over">Sofa alone is {money(product.price - room.budget)} over budget.</p>}
  </article>;
}

export function SofaComparison({ decision, room, mode, onShopSofa, onPreview }: {
  decision: SofaDecision; room: Room; mode: Mode; onShopSofa?: () => void; onPreview?: () => void;
}) {
  const [copied, setCopied] = useState("");
  const { found, recommended, match, find } = decision;
  const alternative = recommended && recommended.variantId !== found.variantId;
  const delta = recommended ? found.price - recommended.price : 0;
  const evidence = mode === "demo" ? demoBuyerEvidence(found.id) : undefined;

  async function share() {
    const url = new URL(sofaFindPath(mode === "demo" ? found.id : found.variantId, "shared"), window.location.origin);
    try { await navigator.clipboard.writeText(url.href); setCopied("Link copied."); }
    catch { setCopied(url.href); }
  }

  return <section className="sofa-comparison" aria-labelledby="fit-check-heading">
    <header className="fit-heading">
      <div><div className="eyebrow"><Ruler size={15} /> {findSourceLabel(find)}</div>
        <h2 id="fit-check-heading">Does this sofa work in your room?</h2></div>
      <Button variant="outline" onClick={() => void share()}><Link2 size={15} /> Copy shopping link</Button>
    </header>
    <p className="fit-source">{match === "exact" ? "Recommendation" : "Catalog suggestion for"} · {find.reference}</p>
    {copied && <p className="fit-source" role="status">{copied}</p>}
    {evidence?.count !== undefined && <section className="fit-buyer-evidence" aria-label="Buyer evidence for this sofa">
      <p className="feed-proof"><CheckCircle2 size={15} /> <strong>{evidence.count} verified buyers</strong><span>Sample purchase data</span></p>
      <div>{evidence.posts.map(post => <Link key={post.id} href={`/#post-${post.id}`}>{post.buyer} on {platformLabels[post.platform]} <ArrowRight size={13} /></Link>)}</div>
    </section>}
    <div className="fit-card-grid">
      <SofaCard product={found} room={room} label={match === "exact" ? "The sofa you found" : "Suggested catalog match"} />
      {alternative && <SofaCard product={recommended} room={room} label="Closest eligible alternative" />}
    </div>
    {recommended ? <div className="fit-next">
      <p>{alternative ? `${recommended.title} starts each plan${delta > 0 ? ` and frees up ${money(delta)} for the rest of the room` : ""}.` : `${found.title} starts each plan.`}</p>
      <div className="fit-actions">
        {onShopSofa && <Button variant="outline" onClick={onShopSofa}>Shop sofa first <ArrowRight size={16} /></Button>}
        {onPreview && <Button onClick={onPreview}>Visualize in my room <ArrowRight size={16} /></Button>}
      </div>
    </div> : <p className="notice">No available sofa in this search meets your entered limits and budget. Update your measurements or budget to try again.</p>}
    <p className="fit-limit">Confirm doorways and delivery access with the merchant.</p>
  </section>;
}

export function SelectedSofaFit({ product, room, onFindAlternative }: { product: Product; room: Room; onFindAlternative: () => void }) {
  const verdict = fitVerdict(product, room);
  return <section className="selected-sofa-fit" aria-label="Current sofa fit">
    <div><h3><Ruler size={16} /> {product.title}</h3><strong className={verdict.tone}>{verdict.label}</strong></div>
    <FitChecks product={product} room={room} />
    {fits(product, room) === false && <Button variant="outline" onClick={onFindAlternative}>Find a sofa that fits <ArrowRight size={15} /></Button>}
  </section>;
}
