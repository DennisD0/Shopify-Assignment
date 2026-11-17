"use client";

import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { money, remaining, subtotal } from "@/lib/budget";
import { useRoom } from "@/lib/store";
import { categoryNames } from "@/lib/types";
import { Button } from "./ui";
import { SofaComparison } from "./sofa-fit";

export function Concepts() {
  const { room, mode, result, navigate, choose, shopSofaFirst } = useRoom();
  if (!result) return null;
  const balanced = result.concepts.find(concept => concept.id === "balanced");
  const original = result.decision?.found;
  const preview = balanced && original ? {
    ...balanced,
    id: "buyer-find",
    name: "Your buyer find",
    lines: balanced.lines.map(line => line.product.category === "sofa" ? { ...line, product: original, locked: false } : line),
  } : undefined;
  return <section>
    <Button variant="ghost" className="back-button" onClick={() => navigate(0)}><ArrowLeft size={16} /> Room details</Button>
    {result.decision && <SofaComparison decision={result.decision} room={room} mode={mode}
      onPreview={preview ? () => choose(preview) : undefined}
      onShopSofa={balanced ? () => shopSofaFirst(balanced) : undefined} />}
    {!result.concepts.length && <Button variant="outline" onClick={() => navigate(0)}>Edit room details <ArrowRight size={16} /></Button>}
    {result.concepts.length > 0 && <>
    <div className="section-heading">
      <div className="eyebrow"><Sparkles size={15} /> {room.style}</div>
      <h1>{result.decision ? "Build the room around it." : "Find your kind of living room."}</h1>
      <p>Three furniture bundles for a {money(room.budget)} product budget. Pick one to make it yours.</p>
      {result.designNote && <p className="design-note">{result.designNote}</p>}
    </div>
    <div className="concept-grid">
      {result.concepts.map(concept => {
        const left = remaining(concept.lines, room.budget);
        const recommended = concept.id === "balanced";
        return <article key={concept.id} className={`concept-card ${recommended ? "recommended" : ""}`}>
          <div className="concept-image"><img src={concept.photo} alt={`${concept.name} room inspiration`} />
            <span className="image-tag">Inspiration</span>
            {recommended && <span className="recommend-tag"><Sparkles size={13} /> Recommended</span>}
          </div>
          <div className="concept-content">
            <h2>{concept.name}</h2><p>{concept.description}</p>
            <ul>{concept.lines.map(({ product }) => <li key={product.category}><Check size={13} />{categoryNames[product.category]}</li>)}</ul>
            <div className="concept-total"><strong>{money(subtotal(concept.lines))}</strong><span className={left < 0 ? "over" : "under"}>{money(Math.abs(left))} {left < 0 ? "over budget" : "left"}</span></div>
            <Button variant={recommended ? "primary" : "outline"} onClick={() => choose(concept)}>Select &amp; customize <ArrowRight size={16} /></Button>
          </div>
        </article>;
      })}
    </div>
    </>}
  </section>;
}
