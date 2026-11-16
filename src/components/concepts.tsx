"use client";

import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { money, remaining, subtotal } from "@/lib/budget";
import { useRoom } from "@/lib/store";
import { categoryNames } from "@/lib/types";
import { Button } from "./ui";

export function Concepts() {
  const { room, result, navigate, choose } = useRoom();
  if (!result) return null;
  return <section>
    <Button variant="ghost" className="back-button" onClick={() => navigate(0)}><ArrowLeft size={16} /> Room details</Button>
    <div className="section-heading">
      <div className="eyebrow"><Sparkles size={15} /> {room.style}</div>
      <h1>Find your kind of living room.</h1>
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
  </section>;
}
