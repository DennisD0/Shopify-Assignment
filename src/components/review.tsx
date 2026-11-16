"use client";

import { useState } from "react";
import { ArrowLeft, CircleAlert, ExternalLink, LoaderCircle, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import { fits, merchantGroups, money } from "@/lib/budget";
import { useRoom } from "@/lib/store";
import { categoryNames } from "@/lib/types";
import { BudgetSummary } from "./editor";
import { Button } from "./ui";

type Handoff = { url?: string; warning?: string; error?: string; demo?: boolean; shipping?: number; tax?: number };

export function Review() {
  const { lines, mode, room, navigate } = useRoom();
  const [pending, setPending] = useState<string>();
  const [handoffs, setHandoffs] = useState<Record<string, Handoff>>({});
  const groups = merchantGroups(lines);

  async function prepare(group: (typeof groups)[number]) {
    setPending(group.id);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode, zip: room.zip,
          lines: group.lines.map(({ product, quantity }) => ({
            variantId: product.variantId, category: product.category, expectedPrice: product.price, quantity,
          })),
        }),
      });
      const result: Handoff = await res.json();
      if (!res.ok) throw new Error(result.error || "Couldn’t prepare this cart.");
      setHandoffs(previous => ({ ...previous, [group.id]: result }));
    } catch (e) {
      setHandoffs(previous => ({ ...previous, [group.id]: { error: e instanceof Error ? e.message : "Couldn’t prepare this cart." } }));
    } finally { setPending(undefined); }
  }
  return <section>
    <Button variant="ghost" className="back-button" onClick={() => navigate(2)}><ArrowLeft size={16} /> Customize room</Button>
    <div className="editor-heading"><div><div className="eyebrow"><ShoppingBag size={15} /> PURCHASE REVIEW</div><h1>Your room, ready to shop.</h1><p>Review your furniture and continue with each merchant separately.</p></div></div>
    <div className="review-grid">
      <div className="merchant-list">{groups.map(group => {
        const handoff = handoffs[group.id];
        return <article key={group.id} className="merchant-card">
          <header><div><ShoppingBag size={20} /><h2>{group.merchant}</h2></div><strong>{money(group.total)}</strong></header>
          {group.lines.map(({ product, quantity }) => {
            const fit = fits(product, room);
            return <div className="review-line" key={product.variantId}><img src={product.image} alt="" />
              <div><small>{categoryNames[product.category]}</small><strong>{product.title}</strong><span>{product.variant} · Qty {quantity} · {money(product.price)} each</span>
                {fit === false && <small className="over">Exceeds entered room footprint</small>}
                {fit === undefined && <small>{product.dimensions ? `${product.dimensions.width} × ${product.dimensions.depth} in · Check room fit` : "Confirm dimensions with merchant"}</small>}
                {!product.available && <small className="over">Unavailable</small>}
              </div><b>{money(product.price * quantity)}</b>
            </div>;
          })}
          <div className="merchant-footer">
            {handoff?.error && <p className="error" role="alert"><CircleAlert size={16} /> {handoff.error}</p>}
            {handoff?.warning && <p className="notice" role="status">{handoff.warning}</p>}
            {handoff?.url && (handoff.shipping !== undefined || handoff.tax !== undefined) && <p className="muted">
              Estimated shipping {handoff.shipping === undefined ? "at checkout" : money(handoff.shipping)} · Estimated tax {handoff.tax === undefined ? "at checkout" : money(handoff.tax)}
            </p>}
            {handoff?.demo ? <p className="notice under" role="status"><PackageCheck size={18} /> Demo cart prepared. No merchant checkout was opened.</p> :
              handoff?.url ? <a className="button primary" href={handoff.url} target="_blank" rel="noopener noreferrer">Continue to {group.merchant} <ExternalLink size={15} /></a> :
              <Button variant="outline" disabled={Boolean(pending) || group.lines.some(({ product }) => !product.available)} onClick={() => void prepare(group)}>
                {pending === group.id ? <LoaderCircle size={16} className="animate-spin" /> : <ShoppingBag size={16} />}
                {pending === group.id ? "Preparing cart…" : mode === "demo" ? "Preview demo cart" : "Prepare merchant checkout"}
              </Button>}
          </div>
        </article>;
      })}</div>
      <aside className="review-summary">
        <h2>Room summary</h2>
        <BudgetSummary lines={lines} budget={room.budget} />
        <dl><div><dt>Merchant carts</dt><dd>{groups.length}</dd></div><div><dt>Shipping</dt><dd>At merchant checkout</dd></div><div><dt>Tax</dt><dd>At merchant checkout</dd></div></dl>
        <p className="notice"><Truck size={18} /> {mode === "demo" ? "Demo Mode uses sample furniture and simulated carts." : "Availability, shipping, and taxes are confirmed by each merchant."}</p>
      </aside>
    </div>
  </section>;
}
