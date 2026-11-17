"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { CalendarDays, LoaderCircle } from "lucide-react";
import { merchantGroups, money } from "@/lib/budget";
import { deliveryWindow, quoteDemoDelivery } from "@/lib/demo-delivery";
import { businessDaysUntil, deliveryReports, type buildFurnishingPlan } from "@/lib/furnishing-plan";
import { platformLabels } from "@/lib/discovery-links";
import { categoryNames, type Category, type Line, type Room } from "@/lib/types";
import { Button } from "./ui";
import { SocialSourceIcon } from "./social-source-icon";

type Plan = ReturnType<typeof buildFurnishingPlan>[number];
type Result = { plans: Plan[]; note?: string; laterBudget: number; zip: string };
type Fields = { budget: string; later: string; zip: string; deadline: string; priority: Category };

function localDate(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function PlanCard({ plan, laterBudget, zip, onApply }: { plan: Plan; laterBudget: number; zip: string; onApply: () => void }) {
  return <article className="purchase-plan-option">
    <h3>{plan.label}</h3>
    <p><strong>{money(plan.total)}</strong> before tax · By business day {plan.latest}</p>
    <div className="purchase-plan-items">
      <div><h4>Buy now</h4><ul>{plan.now.map(({ product }) => <li key={product.id}>{product.title}</li>)}</ul></div>
      <div><h4>Buy later</h4>
        {plan.later.length ? <>
          <ul>{plan.later.map(({ product }) => <li key={product.id}>{product.title}</li>)}</ul>
          <p>{money(plan.laterTotal)} est. with standard shipping before tax.
            {plan.laterTotal > laterBudget ? <> Save {money(plan.laterTotal - laterBudget)} more.</> : <> Fits your later budget.</>}
          </p>
        </> : <p>Everything fits this phase.</p>}
      </div>
    </div>
    <ul className="purchase-plan-merchants" aria-label="Merchant delivery estimates">
      {merchantGroups(plan.now).map(group => {
        const method = plan.deliveries[group.id];
        const quote = quoteDemoDelivery(group.merchant, zip)[method];
        const reports = deliveryReports(group.merchant, method);
        const onTime = reports.filter(report => report.arrivedDays <= report.quotedDays).length;
        return <li key={group.id}>
          <strong>{group.merchant} · {quote.label}</strong>
          <span>{deliveryWindow(quote)} · {money(quote.price)} shipping · {money(group.total + quote.price)} before tax</span>
          <small>{reports.length ? `${onTime} of ${reports.length} sample buyer deliveries met the quoted window` : "No sample delivery reports for this method"}</small>
          {reports.map(report => <Link className="social-attribution" key={report.id} href={`/#post-${report.id}`}>
            <SocialSourceIcon platform={report.platform} size={13} />{report.buyer} on {platformLabels[report.platform]} · Arrived in {report.arrivedDays} business days
          </Link>)}
        </li>;
      })}
    </ul>
    <Button variant="outline" onClick={onApply}>Use this plan</Button>
  </article>;
}

export function FurnishingPlan({ lines, room, defaultPriority, onApply }: {
  lines: Line[]; room: Room; defaultPriority?: Category; onApply: (plan: Plan, zip: string) => void;
}) {
  const firstCategory = defaultPriority ?? lines[0].product.category;
  const [fields, setFields] = useState<Fields>({
    budget: String(room.budget / 100), later: "0", deadline: "", zip: room.zip, priority: firstCategory,
  });
  const [result, setResult] = useState<Result>();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  function change<K extends keyof Fields>(key: K, value: Fields[K]) {
    setResult(undefined);
    setError("");
    setFields(previous => ({ ...previous, [key]: value }));
  }

  async function compare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (request.current) return;
    const days = businessDaysUntil(localDate(new Date()), fields.deadline);
    if (days < 0) { setError("Choose a move-in date within the next year."); return; }
    const budget = Math.round(100 * Number(fields.budget));
    const laterBudget = Math.round(100 * Number(fields.later));
    const controller = new AbortController();
    request.current = controller;
    setResult(undefined);
    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/furnishing-plan", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({
          budget, laterBudget, days, priority: fields.priority,
          room: { width: room.width, depth: room.depth, sofaSpace: room.sofaSpace, zip: fields.zip },
          lines: lines.map(({ product, quantity, locked }) => ({ id: product.variantId, category: product.category, quantity, locked })),
        }),
      });
      const data: { plans: Plan[]; note?: string; error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Couldn’t compare furnishing plans.");
      if (!controller.signal.aborted) setResult({ plans: data.plans, note: data.note, laterBudget, zip: fields.zip });
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Couldn’t compare furnishing plans.");
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  function useSample() {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    setResult(undefined);
    setError("");
    setFields({ budget: "800", later: "300", zip: "10001", deadline: localDate(date), priority: fields.priority });
  }

  return <section className="purchase-plan" aria-labelledby="purchase-plan-heading">
    <div className="purchase-plan-header">
      <div><h2 id="purchase-plan-heading"><CalendarDays size={20} /> Buy now / Buy later</h2>
        <p>Compare what fits your move-in budget and deadline.</p></div>
      <Button variant="ghost" disabled={pending} onClick={useSample}>Use sample budget and date</Button>
    </div>
    <form onSubmit={compare}>
      <fieldset className="purchase-plan-fields" disabled={pending}>
        <label>Budget now ($)<input required type="number" min="1" max="100000" step=".01" value={fields.budget} onChange={e => change("budget", e.target.value)} /></label>
        <label>Budget later ($)<input required type="number" min="0" max="100000" step=".01" value={fields.later} onChange={e => change("later", e.target.value)} /></label>
        <label>Move-in date<input required type="date" value={fields.deadline} onChange={e => change("deadline", e.target.value)} /></label>
        <label>Delivery ZIP<input required inputMode="numeric" pattern="[0-9]{5}" maxLength={5} value={fields.zip} onChange={e => change("zip", e.target.value)} /></label>
        <label>Buy first<select value={fields.priority} onChange={e => change("priority", e.target.value as Category)}>
          {lines.map(({ product }) => <option key={product.category} value={product.category}>{categoryNames[product.category]}</option>)}
        </select></label>
        <Button type="submit" disabled={pending}>{pending && <LoaderCircle size={16} className="animate-spin" />}{pending ? "Comparing…" : "Compare plans"}</Button>
      </fieldset>
    </form>
    <p className="purchase-plan-disclosure">Sample delivery estimates and buyer reports. Totals include estimated shipping before tax.</p>
    {error && <p className="error" role="alert">{error}</p>}
    {result && <div className="purchase-plan-result">
      {!result.plans.length ? <p className="notice" role="status">The priority item could not fit both your budget and delivery deadline. Try a different priority, budget or date.</p> : <>
        <p className="notice" role="status">{result.note ? <><strong>AI analysis</strong> · {result.note}</> :
          result.plans.length > 1
            ? <>The lowest-cost plan meets your deadline. The faster plan’s latest estimate is {result.plans[0].latest - result.plans[1].latest} business days earlier.</>
            : <>This plan fits your deadline and gives you the most items within your budget.</>}
        </p>
        <div className="purchase-plan-options">{result.plans.map(plan => <PlanCard key={plan.label} plan={plan} zip={result.zip}
          laterBudget={result.laterBudget} onApply={() => onApply(plan, result.zip)} />)}</div>
      </>}
    </div>}
  </section>;
}
