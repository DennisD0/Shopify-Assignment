"use client";

import { useEffect, useState } from "react";
import { Check, ChevronRight, FlaskConical, LoaderCircle, Store } from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import { demoInventory, demoProducts } from "@/lib/demo";
import { sampleRoom, useRoom } from "@/lib/store";
import type { FurnitureFind, Mode, RoomResult } from "@/lib/types";
import { Editor } from "./editor";
import { Review } from "./review";
import { RoomReadyBrand } from "./roomready-brand";
import { Button } from "./ui";

const steps = [{ page: 2, label: "Customize" }, { page: 3, label: "Review" }] as const;

export function Workspace({ liveEnabled, inbound }: { liveEnabled: boolean; inbound?: FurnitureFind }) {
  const { page, concept, lines, mode, generatedAt, navigate, expireLivePrices } = useRoom();
  const [chosenMode, setChosenMode] = useState<Mode>();
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode !== "live" || !generatedAt) return;
    const timer = window.setTimeout(() => {
      expireLivePrices();
      setError("Shopify prices may have changed. Refresh the catalog to continue.");
    }, Math.max(0, generatedAt + 600_000 - Date.now()));
    return () => window.clearTimeout(timer);
  }, [mode, generatedAt, expireLivePrices]);

  useEffect(() => {
    const controller = new AbortController();
    async function openRoom() {
      if (useRoom.persist && !useRoom.persist.hasHydrated()) await useRoom.persist.rehydrate();
      if (controller.signal.aborted) return;

      const sampleProduct = demoProducts.find(product =>
        product.id === inbound?.reference || product.variantId === inbound?.reference);
      const currentMode = useRoom.getState().mode;
      const isShopifyReference = inbound?.reference.startsWith("gid://shopify/");
      const nextMode: Mode = !liveEnabled ? "demo" :
        chosenMode ?? (sampleProduct ? "demo" : isShopifyReference ? "live" : currentMode);
      useRoom.getState().setMode(nextMode);
      const draft = useRoom.getState();
      const sameFind = inbound && draft.findInput?.reference === inbound.reference &&
        draft.findInput.source === inbound.source && draft.findInput.platform === inbound.platform;

      if (draft.concept && draft.result) {
        if (!inbound || sameFind) { draft.navigate(2); return; }
        if (sampleProduct && nextMode === "demo") { draft.openFind(sampleProduct, inbound); return; }
      }

      if (nextMode === "demo" && (!inbound || sampleProduct || isShopifyReference)) {
        draft.startDraft({ concepts: [], inventory: demoInventory }, sampleProduct, inbound);
        return;
      }

      const response = await fetch("/api/concepts", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({
          mode: nextMode, workspaceOnly: true, room: { ...draft.room, photo: draft.room.photo || sampleRoom },
          find: nextMode === "live" && sampleProduct ? undefined : inbound,
        }),
      });
      const result: RoomResult & { error?: string } = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) {
        throw new Error(result.error || "Couldn’t build a room from this recommendation.");
      }
      useRoom.getState().startDraft(result, result.decision?.recommended, inbound);
    }

    void openRoom().catch(reason => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Couldn’t open Customize.");
    });
    return () => controller.abort();
  }, [liveEnabled, inbound, chosenMode, retry]);

  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  return <MotionConfig reducedMotion="user">
    <header className="site-header workspace-header"><div className="site-inner">
      <RoomReadyBrand />
      <div className="header-actions">
        {liveEnabled ? <label className="mode-label"><Store size={14} /><select aria-label="Catalog mode" value={chosenMode ?? mode} onChange={event => {
          setError("");
          setChosenMode(event.target.value === "live" ? "live" : "demo");
        }}><option value="demo">Demo Mode</option><option value="live">Live Shopify</option></select></label> :
          <span className="mode-label" title="Sample furniture and simulated carts"><FlaskConical size={14} /> Demo Mode</span>}
      </div>
    </div></header>
    <main className="site-inner main">
      <nav className="stepper" aria-label="Room design progress"><ol>{steps.map(({ page: index, label }, i) => <li key={index}>
        {i > 0 && <ChevronRight className="step-chevron" size={15} />}
        <button aria-current={page === index ? "step" : undefined} className={`step ${page === index ? "active" : ""} ${page > index ? "complete" : ""}`} disabled={!concept || (index === 3 && !lines.length)} onClick={() => navigate(index)}>
          <span>{page > index ? <Check size={13} /> : i + 1}</span>{label}
        </button>
      </li>)}</ol></nav>
      {concept && (page === 2 || page === 3) ? <motion.div key={page} initial={{ opacity: 0.65 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        {page === 3 ? <Review /> : <Editor />}
      </motion.div> : error ? <div className="notice">
        <p role="alert">{error}</p>
        <Button variant="outline" onClick={() => { setError(""); setRetry(value => value + 1); }}>Try again</Button>
      </div> : <p className="notice" role="status"><LoaderCircle size={17} className="animate-spin" /> Opening Customize…</p>}
    </main>
    <footer className="site-footer"><div className="site-inner"><span>RoomReady</span><span>{mode === "demo" ? "Sample products · Simulated checkout" : "Shopify catalog · Merchant checkout"}</span></div></footer>
  </MotionConfig>;
}
