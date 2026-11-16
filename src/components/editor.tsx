"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowRightLeft, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Lock, LockOpen, ShoppingBag, Undo2, WandSparkles } from "lucide-react";
import { alternatives, fits, money, optimize, remaining, subtotal } from "@/lib/budget";
import { demoStockStatus } from "@/lib/demo";
import { useRoom } from "@/lib/store";
import { categoryNames, type Category, type Inventory, type Line, type Mode, type Product, type Strategy } from "@/lib/types";
import { Button, Panel } from "./ui";
import { RoomPreview, furnitureCutout, type RoomView } from "./room-preview";
const strategies: [Strategy, string][] = [["similar", "Similar Price"], ["save", "Save Money"], ["explore", "Explore Styles"]];

export function BudgetSummary({ lines, budget }: { lines: Line[]; budget: number }) {
  const left = remaining(lines, budget);
  const total = subtotal(lines);
  return <div className="budget-summary">
    <div className="budget-top"><span>Product subtotal</span><strong>{money(total)}</strong></div>
    <progress className={left < 0 ? "over-progress" : ""} value={Math.min(total, budget)} max={budget} aria-label="Product budget used" />
    <div className="budget-bottom"><span>{money(budget)} budget</span><strong className={left < 0 ? "over" : "under"}>{money(Math.abs(left))} {left < 0 ? "over budget" : "left"}</strong></div>
  </div>;
}

function StockStatus({ product, mode }: { product: Product; mode: Mode }) {
  const status = mode === "demo" ? demoStockStatus(product.id) : product.availabilityStatus;
  const low = mode === "demo" ? status === "low_stock" : product.runningLow;
  const tone = !product.available ? "over" : low ? "stock-low" : status === "in_stock" ? "under" : "muted";
  const label = !product.available ? "Unavailable"
    : low ? "Low stock"
    : status === "in_stock" ? "In stock" : "Available to order";
  return <span className={`stock-status ${tone}`}>{label}</span>;
}

function ProductLine({ line, onSwap }: { line: Line; onSwap: () => void }) {
  const { lock, room, mode } = useRoom();
  const { product } = line;
  const fit = fits(product, room);
  return <article className={`product-line ${line.locked ? "locked" : ""}`}>
    <button className="product-thumb" onClick={onSwap} aria-label={`View alternatives for ${product.title}`}><ProductImage product={product} alt="" /></button>
    <div className="product-info">
      <span className="category-label">{categoryNames[product.category]}</span>
      <button className="product-title" onClick={onSwap}>{product.title}</button>
      <span>{product.merchant} <b>·</b> <strong>{money(product.price)}</strong></span>
      <StockStatus product={product} mode={mode} />
      {fit === false && <small className="over">Exceeds room dimensions</small>}
    </div>
    <div className="line-actions">
      <button className="icon-button lock-button" aria-pressed={line.locked} aria-label={`${line.locked ? "Unlock" : "Lock"} ${product.title}`} title={line.locked ? "Unlock item" : "Lock item"} onClick={() => lock(product.variantId)}>
        {line.locked ? <Lock size={15} /> : <LockOpen size={15} />}
      </button>
      <button className="swap-button" onClick={onSwap} aria-label={`Swap ${product.title}`}><ArrowRightLeft size={13} /> Swap</button>
    </div>
  </article>;
}

function ProductImage({ product, alt }: { product: Product; alt: string }) {
  const cutout = furnitureCutout(product);
  return <img className={cutout ? "cutout-thumbnail" : undefined} src={cutout ?? product.image} alt={alt} />;
}

function SwapPanel({ line, onClose, onSwap }: { line: Line; onClose: () => void; onSwap: (product: Product) => void }) {
  const { result, room, mode } = useRoom();
  const [strategy, setStrategy] = useState<Strategy>("similar");
  const [remote, setRemote] = useState<{ strategy: Strategy; products: Product[]; error?: string }>();
  const carousel = useRef<HTMLDivElement>(null);
  const current = line.product;
  useEffect(() => {
    if (mode !== "live") return;
    const controller = new AbortController();
    fetch("/api/alternatives", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
      body: JSON.stringify({ product: current, room, strategy }),
    }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setRemote({ strategy, products: data.products });
    }).catch(() => {
      if (!controller.signal.aborted) setRemote({ strategy, products: [], error: "Shopify search is unavailable. Showing results from your existing live catalog." });
    });
    return () => controller.abort();
  }, [current, mode, room, strategy]);
  const products = [...new Map([...(result?.inventory[current.category] ?? []), ...(remote?.strategy === strategy ? remote.products : [])].map(p => [p.variantId, p])).values()];
  const options = alternatives(products, current, room, strategy);
  const scroll = (direction: number) => carousel.current?.scrollBy({ left: direction * 230, behavior: "smooth" });
  return <Panel drawer title="Swap & Scroll" description={`Explore alternatives for your ${categoryNames[current.category].toLowerCase()}.`} onClose={onClose}>
    <div className="current-product"><ProductImage product={current} alt="" /><div><small>Currently selected</small><strong>{current.title}</strong><StockStatus product={current} mode={mode} /></div><b>{money(current.price)}</b></div>
    <div className="swap-filters" aria-label="Filter alternatives">{strategies.map(([id, name]) => <button key={id} aria-pressed={strategy === id} onClick={() => { setStrategy(id); carousel.current?.scrollTo({ left: 0 }); }}>{name}</button>)}</div>
    {mode === "live" && remote?.strategy !== strategy && <p role="status" className="muted">Searching Shopify for more options…</p>}
    {remote?.strategy === strategy && remote.error && <p className="notice">{remote.error}</p>}
    {options.length ? <>
      <div className="carousel" ref={carousel}>{options.map(product => {
        const delta = product.price - current.price;
        const fit = fits(product, room);
        return <article className="alternative" key={product.variantId}>
          <ProductImage product={product} alt={product.title} />
          <div><h3>{product.title}</h3><p>{product.merchant} · {product.variant}</p>
            <small>{fit === true ? "Fits entered footprint" : product.dimensions ? `${product.dimensions.width} × ${product.dimensions.depth} in` : "Check merchant dimensions"}</small>
            <StockStatus product={product} mode={mode} />
            <div className="alternative-price"><b>{money(product.price)}</b><span className={delta > 0 ? "over" : "under"}>{delta === 0 ? "Same price" : `${delta > 0 ? "+" : "−"}${money(Math.abs(delta))}`}</span></div>
            <Button variant="outline" onClick={() => onSwap(product)}>Switch to this <ArrowRight size={14} /></Button>
          </div>
        </article>;
      })}</div>
      <div className="carousel-nav"><span>{options.length} options</span><button className="icon-button" aria-label="Previous alternatives" onClick={() => scroll(-1)}><ChevronLeft size={19} /></button><button className="icon-button" aria-label="Next alternatives" onClick={() => scroll(1)}><ChevronRight size={19} /></button></div>
    </> : <p className="notice" role="status">No {strategy === "save" ? "cheaper " : ""}alternatives found. Try another filter.</p>}
    {line.locked && <p className="notice">This item is locked for budget optimization. A manual switch keeps the replacement locked.</p>}
  </Panel>;
}

function OptimizationPanel({ onClose, onApply }: { onClose: () => void; onApply: () => void }) {
  const { room, lines, mode, result, optimize: approve } = useRoom();
  const [search, setSearch] = useState<{ products: [Category, Product[]][]; partial: boolean }>();
  const needsSearch = mode === "live" && subtotal(lines) > room.budget && lines.some(line => !line.locked);
  useEffect(() => {
    if (!needsSearch) return;
    const controller = new AbortController();
    void Promise.allSettled(lines.filter(line => !line.locked).map(async ({ product }): Promise<[Category, Product[]]> => {
      const response = await fetch("/api/alternatives", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ product, room, strategy: "save" }),
      });
      if (!response.ok) throw new Error("Search failed");
      const data: { products: Product[] } = await response.json();
      return [product.category, data.products];
    })).then(results => {
      if (!controller.signal.aborted) setSearch({
        products: results.flatMap(entry => entry.status === "fulfilled" ? [entry.value] : []),
        partial: results.some(entry => entry.status === "rejected"),
      });
    });
    return () => controller.abort();
  }, [lines, needsSearch, room]);
  if (!result) return null;
  if (needsSearch && !search) return <Panel title="Make it fit your budget" description="Searching Shopify for lower-priced pieces." onClose={onClose}><p role="status">Checking unlocked furniture…</p></Panel>;
  const inventory: Inventory = { ...result.inventory };
  for (const [category, candidates] of search?.products ?? []) {
    inventory[category] = [...new Map([...inventory[category], ...candidates].map(p => [p.variantId, p])).values()];
  }
  const proposal = optimize(lines, inventory, room);
  return <Panel title="Make it fit your budget" description="Your locked furniture stays in the room." onClose={onClose}>
    {search?.partial && <p className="notice">Some Shopify searches were unavailable. This proposal uses the prices RoomReady could find.</p>}
    <div className="comparison"><span>Current subtotal<strong>{money(proposal.before)}</strong></span><ArrowRight size={21} /><span>Proposed subtotal<strong>{money(proposal.after)}</strong></span></div>
    {proposal.before <= room.budget ? <p className="notice">You’re already within your product budget.</p> : <>
      {!proposal.fitsBudget && <p className="notice"><CircleAlert size={17} /> The least expensive available combination that preserves your locks is still {money(proposal.after - room.budget)} over budget.</p>}
      {proposal.changes.map(({ from, to, savings }) => <div className="optimization-change" key={from.product.variantId}>
        <ProductImage product={to.product} alt="" /><div><small>{categoryNames[from.product.category]}</small><strong>{to.product.title}</strong><span>Replaces {from.product.title}</span></div><b className="under">Save {money(savings)}</b>
      </div>)}
      {!proposal.changes.length && <p className="muted">No lower-cost eligible replacement was found for any unlocked piece.</p>}
      {!!proposal.changes.length && <p className="optimization-saving">Total product savings <strong>{money(proposal.before - proposal.after)}</strong></p>}
    </>}
    <div className="panel-actions"><Button variant="outline" onClick={onClose}>{proposal.changes.length ? "Cancel" : "Back to room"}</Button>
      {!!proposal.changes.length && <Button onClick={() => { approve(proposal); onApply(); }}>Apply substitutions <ArrowRight size={16} /></Button>}
    </div>
  </Panel>;
}

export function Editor() {
  const { concept, lines, room, mode, previous, swap, undo, navigate } = useRoom();
  const [selection, setSelection] = useState<string>();
  const [showOptimize, setShowOptimize] = useState(false);
  const [view, setView] = useState<RoomView>("furniture");
  const [updateMessage, setUpdateMessage] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const previewRef = useRef<HTMLElement>(null);
  if (!concept) return null;
  const selected = lines.find(line => line.product.variantId === selection);

  function showChange(message: string) {
    setView("furniture");
    setUpdateMessage(message);
    requestAnimationFrame(() => previewRef.current?.scrollIntoView({ block: "nearest" }));
  }

  return <section>
    <Button variant="ghost" className="back-button" onClick={() => navigate(1)}><ArrowLeft size={16} /> Room concepts</Button>
    <div className="editor-heading"><div><div className="eyebrow">{room.style}</div><h1>Make it yours.</h1><p>{concept.name} · {lines.length} furniture pieces</p></div>
      {previous && <Button variant="outline" onClick={() => { undo(); showChange("Last change undone."); }}><Undo2 size={16} /> Undo last change</Button>}
    </div>
    <div className="editor-grid">
      <div className="editor-main">
        <RoomPreview concept={concept} lines={lines} photo={room.photo} mode={mode} view={view} onView={setView} onSelect={setSelection} previewRef={previewRef} />
        <div role="status">{updateMessage && <p className="room-update"><Check size={15} />{updateMessage}</p>}</div>
        <div className="optimizer-banner"><div className="feature-icon"><WandSparkles size={22} /></div><div><h3>Keep your favorites.</h3><p>Lock the pieces you love and preview savings on the rest.</p></div>
          <Button variant="outline" onClick={() => setShowOptimize(true)}>Make It Fit My Budget</Button></div>
      </div>
      <aside className="editor-sidebar">
        <button className="furniture-heading" aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}><span>Furniture picks <small>{lines.length}</small></span><ChevronDown size={18} /></button>
        <h2 className="furniture-desktop-heading">Furniture picks <small>{lines.length}</small></h2>
        <div className={`furniture-list ${collapsed ? "collapsed" : ""}`}>{lines.map(line => <ProductLine line={line} key={line.product.category} onSwap={() => setSelection(line.product.variantId)} />)}</div>
        <div className="editor-budget"><BudgetSummary lines={lines} budget={room.budget} /><Button className="review-button" onClick={() => navigate(3)}><ShoppingBag size={16} /> Review My Bundle <ArrowRight size={16} /></Button></div>
      </aside>
    </div>
    {selected && <SwapPanel key={selection} line={selected} onClose={() => setSelection(undefined)} onSwap={product => {
      swap(selected.product.variantId, product);
      setSelection(undefined);
      showChange(`Replaced ${selected.product.title} with ${product.title}.`);
    }} />}
    {showOptimize && <OptimizationPanel onClose={() => setShowOptimize(false)} onApply={() => {
      setShowOptimize(false);
      showChange("Budget substitutions applied to your room.");
    }} />}
  </section>;
}
