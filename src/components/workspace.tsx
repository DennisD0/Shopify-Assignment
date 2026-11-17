"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, FlaskConical, ShoppingBag, Sofa, Store } from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import { useRoom } from "@/lib/store";
import type { SofaFind } from "@/lib/types";
import { Concepts } from "./concepts";
import { Editor } from "./editor";
import { Onboarding } from "./onboarding";
import { Review } from "./review";

const steps = ["Room setup", "Concepts", "Customize", "Review"];
const pages = { 1: Concepts, 2: Editor, 3: Review };

export function Workspace({ liveEnabled, aiEnabled, inbound, openSetup }: { liveEnabled: boolean; aiEnabled: boolean; inbound?: SofaFind; openSetup: boolean }) {
  const { page, result, concept, mode, generatedAt, navigate, setMode, expireLivePrices } = useRoom();
  const [expired, setExpired] = useState<number>();
  useEffect(() => {
    if (mode !== "live" || !generatedAt) return;
    const timer = window.setTimeout(() => { expireLivePrices(); setExpired(generatedAt); }, Math.max(0, generatedAt + 600_000 - Date.now()));
    return () => window.clearTimeout(timer);
  }, [mode, generatedAt, expireLivePrices]);
  useEffect(() => {
    void Promise.resolve(useRoom.persist.rehydrate()).then(() => {
      const draft = useRoom.getState();
      if ((!liveEnabled && draft.mode === "live") || inbound?.reference.startsWith("demo-sofa-")) draft.setMode("demo");
      if (liveEnabled && inbound?.reference.startsWith("gid://shopify/")) draft.setMode("live");
      if (inbound) draft.setFindInput(inbound);
      if (inbound || openSetup) draft.navigate(0);
    });
  }, [liveEnabled, inbound, openSetup]);
  const Page = page === 0 ? undefined : pages[page];
  const stale = mode === "live" && Boolean(generatedAt && expired === generatedAt);
  function go(index: 0 | 1 | 2 | 3) {
    navigate(index);
    window.scrollTo(0, 0);
  }
  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  return <MotionConfig reducedMotion="user">
    <header className="site-header"><div className="site-inner">
      <Link className="brand" aria-label="RoomReady buyer feed" href="/"><span className="brand-mark"><Sofa size={23} strokeWidth={1.85} /></span><span>Room<span className="brand-accent">Ready</span></span></Link>
      <div className="header-actions">
        {concept && !stale && <button className="draft-link" onClick={() => go(2)}><ShoppingBag size={16} /> My room</button>}
        {liveEnabled ? <label className="mode-label"><Store size={14} /><select aria-label="Catalog mode" value={mode} onChange={e => setMode(e.target.value === "live" ? "live" : "demo")}><option value="demo">Demo Mode</option><option value="live">Live Shopify</option></select></label> :
          <span className="mode-label" title="Sample furniture and simulated carts"><FlaskConical size={14} /> Demo Mode</span>}
      </div>
    </div></header>
    <main className="site-inner main">
      <nav className="stepper" aria-label="Room design progress"><ol>{steps.map((step, i) => {
        const index = i as 0 | 1 | 2 | 3;
        const available = index === 0 || (!stale && (index === 1 ? Boolean(result) : Boolean(concept)));
        return <li key={step}>
          {i > 0 && <ChevronRight className="step-chevron" size={15} />}
          <button aria-current={page === i ? "step" : undefined} className={`step ${page === i ? "active" : ""} ${page > i ? "complete" : ""}`} disabled={!available} onClick={() => go(index)}>
            <span>{page > i ? <Check size={13} /> : i + 1}</span>{index === 1 && result?.decision ? "Fit check" : step}
          </button>
        </li>;
      })}</ol></nav>
      {stale && <p className="notice mb-4" role="status">Shopify prices may have changed. Create new setups to refresh prices and availability.</p>}
      <motion.div key={page} initial={{ opacity: 0.65 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        {Page ? <Page /> : <Onboarding aiEnabled={aiEnabled} inbound={inbound} />}
      </motion.div>
    </main>
    <footer className="site-footer"><div className="site-inner"><span>RoomReady</span><span>{mode === "demo" ? "Sample products · Simulated checkout" : "Shopify catalog · Merchant checkout"}</span></div></footer>
  </MotionConfig>;
}
