"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CircleAlert, ExternalLink, LoaderCircle, PackageCheck, ShoppingBag, Trash2, Truck, Zap } from "lucide-react";
import { fits, merchantGroups, money } from "@/lib/budget";
import { deliveryWindow, demoDeliveryOptions, quoteDemoDelivery, type DemoDeliveryOption, type DemoDeliveryQuote } from "@/lib/demo-delivery";
import { useRoom } from "@/lib/store";
import { categoryNames } from "@/lib/types";
import { BudgetSummary } from "./editor";
import { Button } from "./ui";

type Handoff = { url?: string; warning?: string; error?: string; demo?: boolean; shipping?: number; tax?: number; delivery?: DemoDeliveryQuote; total?: number };
type MerchantGroup = ReturnType<typeof merchantGroups>[number];

function MerchantCart({ group, deliveryOption, onDeliveryChange }: {
  group: MerchantGroup; deliveryOption: DemoDeliveryOption; onDeliveryChange: (option: DemoDeliveryOption) => void;
}) {
  const { mode, room, removeFromCart } = useRoom();
  const [handoff, setHandoff] = useState<Handoff>();
  const [pending, setPending] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const demo = mode === "demo";
  const quotes = demo ? quoteDemoDelivery(group.merchant, room.zip) : undefined;

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
          mode, zip: room.zip, ...(demo ? { deliveryOption } : {}),
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
    {quotes && <fieldset className="delivery-options" disabled={pending}>
      <legend><Truck size={16} /> Demo delivery options</legend>
      {demoDeliveryOptions.map(id => {
        const quote = quotes[id];
        return <label key={id} className="delivery-option">
          <input type="radio" name={`delivery-${group.id}`} value={id} checked={deliveryOption === id} onChange={() => {
            setHandoff(undefined);
            onDeliveryChange(id);
          }} />
          <span className="delivery-option-copy">
            <strong>{quote.label}</strong>
            {id === "express" && <span className="delivery-fastest"><Zap size={12} /> Fastest delivery</span>}
            <small>Estimated arrival in {deliveryWindow(quote)}</small>
          </span>
          <b>{money(quote.price)}</b>
        </label>;
      })}
      <p className="merchant-estimate"><span>Est. total before tax</span><strong>{money(group.total + quotes[deliveryOption].price)}</strong></p>
    </fieldset>}
    <div className="merchant-footer">
      {handoff?.error && <p className="error" role="alert"><CircleAlert size={16} /> {handoff.error}</p>}
      {handoff?.warning && <p className="notice" role="status">{handoff.warning}</p>}
      {handoff?.url && (handoff.shipping !== undefined || handoff.tax !== undefined) && <p className="muted">
        Estimated shipping {handoff.shipping === undefined ? "at checkout" : money(handoff.shipping)} · Estimated tax {handoff.tax === undefined ? "at checkout" : money(handoff.tax)}
      </p>}
      {handoff?.demo ? <p className="notice under" role="status"><PackageCheck size={18} />
        <span><strong>Demo order simulated.</strong>{handoff.delivery && handoff.total !== undefined &&
          <> {handoff.delivery.label} delivery · {deliveryWindow(handoff.delivery)} · {money(handoff.total)} before tax.</>}</span>
      </p> :
        handoff?.url ? <a className="button primary" href={handoff.url} target="_blank" rel="noopener noreferrer">Continue to {group.merchant} <ExternalLink size={15} /></a> :
        <Button variant="outline" disabled={pending || group.lines.some(({ product }) => !product.available)} onClick={() => void prepare()}>
          {pending ? <LoaderCircle size={16} className="animate-spin" /> : <ShoppingBag size={16} />}
          {pending ? "Preparing cart…" : mode === "demo" ? "Order" : "Prepare merchant checkout"}
        </Button>}
    </div>
  </article>;
}

export function Review() {
  const { lines, mode, room, setRoom, navigate, excludedFromCart, restoreToCart } = useRoom();
  const [deliverySelections, setDeliverySelections] = useState<Partial<Record<string, DemoDeliveryOption>>>({});
  const [zip, setZip] = useState(room.zip);
  const cartLines = lines.filter(({ product }) => !excludedFromCart.includes(product.variantId));
  const removed = lines.filter(({ product }) => excludedFromCart.includes(product.variantId));
  const groups = merchantGroups(cartLines);
  const demo = mode === "demo";
  const estimatedShipping = demo ? groups.reduce((total, group) =>
    total + quoteDemoDelivery(group.merchant, room.zip)[deliverySelections[group.id] ?? "standard"].price, 0) : 0;
  const itemsTotal = groups.reduce((total, group) => total + group.total, 0);

  return <section>
    <Button variant="ghost" className="back-button" onClick={() => navigate(2)}><ArrowLeft size={16} /> Customize room</Button>
    <div className="editor-heading"><div><div className="eyebrow"><ShoppingBag size={15} /> PURCHASE REVIEW</div><h1>Your room, ready to shop.</h1><p>Review your furniture and continue with each merchant separately.</p></div></div>
    <div className="review-grid">
      <div className="merchant-list">
        {groups.map(group => <MerchantCart group={group} deliveryOption={deliverySelections[group.id] ?? "standard"}
          onDeliveryChange={option => setDeliverySelections(previous => ({ ...previous, [group.id]: option }))}
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
        {demo && <form className="delivery-zip" onSubmit={event => { event.preventDefault(); setRoom({ zip }); }}>
          <label htmlFor="review-zip">Delivery ZIP code <small>Optional</small></label>
          <div><input id="review-zip" inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{5}" maxLength={5}
            placeholder="ZIP code" value={zip} onChange={event => setZip(event.target.value)} />
            <Button type="submit" variant="outline" disabled={zip === room.zip}>Apply</Button></div>
          <small role="status">{room.zip ? `Estimates for ZIP ${room.zip}` : "General demo estimates"}</small>
        </form>}
        <dl>
          <div><dt>Merchant carts</dt><dd>{groups.length}</dd></div>
          <div><dt>{demo ? "Estimated shipping" : "Shipping"}</dt><dd>{demo ? money(estimatedShipping) : "At merchant checkout"}</dd></div>
          <div><dt>Tax</dt><dd>{demo ? "Excluded from estimate" : "At merchant checkout"}</dd></div>
          {demo && <div className="review-estimated-total"><dt>Est. total before tax</dt><dd>{money(itemsTotal + estimatedShipping)}</dd></div>}
        </dl>
        <p className="notice"><Truck size={18} /> {demo ? "Demo Mode simulates delivery estimates and orders." : "Availability, shipping, and taxes are confirmed by each merchant."}</p>
      </aside>
    </div>
  </section>;
}
