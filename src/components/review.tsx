"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CircleAlert, ExternalLink, LoaderCircle, PackageCheck, ShoppingBag, Trash2, Truck } from "lucide-react";
import { fits, merchantGroups, money } from "@/lib/budget";
import { useRoom } from "@/lib/store";
import { categoryNames } from "@/lib/types";
import { BudgetSummary } from "./editor";
import { Button } from "./ui";

type Handoff = { url?: string; warning?: string; error?: string; demo?: boolean; shipping?: number; tax?: number };
type MerchantGroup = ReturnType<typeof merchantGroups>[number];

function MerchantCart({ group }: { group: MerchantGroup }) {
  const { mode, room, removeFromCart } = useRoom();
  const [handoff, setHandoff] = useState<Handoff>();
  const [pending, setPending] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  async function prepare() {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setHandoff(undefined);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({
          mode, zip: room.zip,
          lines: group.lines.map(({ product, quantity }) => ({
            variantId: product.variantId, category: product.category, expectedPrice: product.price, quantity,
          })),
        }),
      });
      const result: Handoff = await res.json();
      if (!res.ok) throw new Error(result.error || "Couldn’t prepare this cart.");
      if (!controller.signal.aborted) setHandoff(result);
    } catch (e) {
      if (!controller.signal.aborted) setHandoff({ error: e instanceof Error ? e.message : "Couldn’t prepare this cart." });
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  return <article className="merchant-card">
    <header><div><ShoppingBag size={20} /><h2>{group.merchant}</h2></div><strong>{money(group.total)}</strong></header>
    {group.lines.map(({ product, quantity }) => {
      const fit = fits(product, room);
      return <div className="review-line" key={product.variantId}>
        <img src={product.image} alt="" />
        <div className="review-line-details"><small>{categoryNames[product.category]}</small><strong>{product.title}</strong><span>{product.variant} · Qty {quantity} · {money(product.price)} each</span>
          {fit === false && <small className="over">Exceeds entered room footprint</small>}
          {fit === undefined && <small>{product.dimensions ? `${product.dimensions.width} × ${product.dimensions.depth} in · Check room fit` : "Confirm dimensions with merchant"}</small>}
          {!product.available && <small className="over">Unavailable</small>}
        </div>
        <div className="review-line-actions"><b>{money(product.price * quantity)}</b>
          <Button variant="ghost" aria-label={`Remove ${product.title} from cart`} onClick={() => removeFromCart(product.variantId)}><Trash2 size={14} /> Remove</Button>
        </div>
      </div>;
    })}
    <div className="merchant-footer">
      {handoff?.error && <p className="error" role="alert"><CircleAlert size={16} /> {handoff.error}</p>}
      {handoff?.warning && <p className="notice" role="status">{handoff.warning}</p>}
      {handoff?.url && (handoff.shipping !== undefined || handoff.tax !== undefined) && <p className="muted">
        Estimated shipping {handoff.shipping === undefined ? "at checkout" : money(handoff.shipping)} · Estimated tax {handoff.tax === undefined ? "at checkout" : money(handoff.tax)}
      </p>}
      {handoff?.demo ? <p className="notice under" role="status"><PackageCheck size={18} /> Demo order simulated.</p> :
        handoff?.url ? <a className="button primary" href={handoff.url} target="_blank" rel="noopener noreferrer">Continue to {group.merchant} <ExternalLink size={15} /></a> :
        <Button variant="outline" disabled={pending || group.lines.some(({ product }) => !product.available)} onClick={() => void prepare()}>
          {pending ? <LoaderCircle size={16} className="animate-spin" /> : <ShoppingBag size={16} />}
          {pending ? "Preparing cart…" : mode === "demo" ? "Order" : "Prepare merchant checkout"}
        </Button>}
    </div>
  </article>;
}

export function Review() {
  const { lines, mode, room, navigate, excludedFromCart, restoreToCart } = useRoom();
  const cartLines = lines.filter(({ product }) => !excludedFromCart.includes(product.variantId));
  const removed = lines.filter(({ product }) => excludedFromCart.includes(product.variantId));
  const groups = merchantGroups(cartLines);

  return <section>
    <Button variant="ghost" className="back-button" onClick={() => navigate(2)}><ArrowLeft size={16} /> Customize room</Button>
    <div className="editor-heading"><div><div className="eyebrow"><ShoppingBag size={15} /> PURCHASE REVIEW</div><h1>Your room, ready to shop.</h1><p>Review your furniture and continue with each merchant separately.</p></div></div>
    <div className="review-grid">
      <div className="merchant-list">
        {groups.map(group => <MerchantCart group={group}
          key={JSON.stringify([mode, room.zip, group.id, group.lines.map(({ product, quantity }) => [product.variantId, product.price, quantity])])} />)}
        {!groups.length && <p className="notice" role="status"><ShoppingBag size={18} /> Your cart is empty. Add an item back to continue.</p>}
        {removed.length > 0 && <section className="merchant-card removed-items" aria-labelledby="removed-items-heading">
          <h2 id="removed-items-heading">Removed items</h2>
          {removed.map(({ product }) => <div key={product.variantId} className="removed-item">
            <span>{product.title}</span>
            <Button variant="ghost" aria-label={`Add ${product.title} back to cart`} onClick={() => restoreToCart(product.variantId)}>Add back</Button>
          </div>)}
        </section>}
      </div>
      <aside className="review-summary">
        <h2>Cart summary</h2>
        <BudgetSummary lines={cartLines} budget={room.budget} />
        <dl><div><dt>Merchant carts</dt><dd>{groups.length}</dd></div><div><dt>Shipping</dt><dd>At merchant checkout</dd></div><div><dt>Tax</dt><dd>At merchant checkout</dd></div></dl>
        <p className="notice"><Truck size={18} /> {mode === "demo" ? "Demo Mode simulates orders using sample furniture." : "Availability, shipping, and taxes are confirmed by each merchant."}</p>
      </aside>
    </div>
  </section>;
}
