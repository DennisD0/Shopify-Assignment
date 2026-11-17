"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Camera, Check, ChevronDown, ImagePlus, Images, Leaf, Link2, LoaderCircle, ScanLine, Sofa, Sparkles, UploadCloud, Wallet } from "lucide-react";
import { styles, type DiscoverySource, type RoomResult, type SofaFind } from "@/lib/types";
import { demoInventory } from "@/lib/demo";
import { findSourceLabel } from "@/lib/discovery-links";
import { money } from "@/lib/budget";
import { sampleRoom, useRoom } from "@/lib/store";
import { Button } from "./ui";

const styleIcons = [ScanLine, Leaf, Sofa];

async function preparePhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 12_000_000)
    throw new Error("Choose a JPG, PNG, or WebP image under 12 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser couldn’t read the photo.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally { bitmap.close(); }
}

export function Onboarding({ aiEnabled, inbound }: { aiEnabled: boolean; inbound?: SofaFind }) {
  const { room, mode, setRoom, findInput, setFindInput, generated } = useRoom();
  const currentFind = findInput ?? inbound;
  const sharedDemoProduct = demoInventory.sofa.find(product => product.id === currentFind?.reference);
  const reference = sharedDemoProduct?.title ?? currentFind?.reference ?? "";
  const source = currentFind?.source ?? "assistant";
  const platform = currentFind?.platform;
  const checkingSofa = Boolean(reference.trim());
  const input = useRef<HTMLInputElement>(null);
  const generation = useRef<AbortController | null>(null);
  const [extras, setExtras] = useState(Boolean(room.width || room.depth || room.zip));
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [showRoomSetup, setShowRoomSetup] = useState(false);
  const quickCheck = Boolean(inbound && checkingSofa && !showRoomSetup);
  useEffect(() => () => { generation.current?.abort(); }, [mode]);

  async function upload(file?: File) {
    if (!file) return;
    setError("");
    setReading(true);
    try { setRoom({ photo: await preparePhoto(file) }); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn’t open the photo."); }
    finally { setReading(false); }
  }
  function changePhoto(e: ChangeEvent<HTMLInputElement>) {
    void upload(e.target.files?.[0]);
    e.target.value = "";
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (reading || pending) return;
    if (!room.photo && !checkingSofa) { setError("Upload a room photo or choose the sample room."); return; }
    const partialRoom = Boolean(room.width) !== Boolean(room.depth);
    if (partialRoom && !quickCheck) {
      setExtras(true); setError("Enter both room measurements or leave them blank."); return;
    }
    setPending(true);
    setError("");
    const controller = new AbortController();
    generation.current = controller;
    const roomForRequest = { ...room, ...(partialRoom ? { width: 0, depth: 0 } : {}), photo: room.photo || sampleRoom };
    try {
      const response = await fetch("/api/concepts", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ room: roomForRequest, mode, find: checkingSofa ? { reference, source, platform } : undefined }),
      });
      const result: RoomResult & { error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error || "Couldn’t create your room setups.");
      if (!controller.signal.aborted && useRoom.getState().mode === mode) {
        if (!room.photo || partialRoom) setRoom(roomForRequest);
        generated(result);
      }
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Couldn’t create your room setups.");
    } finally {
      if (generation.current === controller) { generation.current = null; setPending(false); }
    }
  }
  const sampleMeasurements = (replacePhoto = false) => {
    setRoom({ photo: replacePhoto ? sampleRoom : room.photo || sampleRoom, ...(checkingSofa && mode === "demo" ? { sofaSpace: { width: 80, depth: 40 } } : {}) });
    setError("");
  };
  const measurements = <div className="discovery-measurements">
    <label>Usable sofa width (in)<input type="number" min="1" max="300" step=".1" value={room.sofaSpace?.width || ""}
      onChange={e => setRoom({ sofaSpace: { width: Number(e.target.value), depth: room.sofaSpace?.depth ?? 0 } })} /></label>
    <label>Usable sofa depth (in)<input type="number" min="1" max="300" step=".1" value={room.sofaSpace?.depth || ""}
      onChange={e => setRoom({ sofaSpace: { width: room.sofaSpace?.width ?? 0, depth: Number(e.target.value) } })} /></label>
  </div>;
  const budgetInput = <label className="currency-field"><span>$</span><input aria-label="Furnishing budget in US dollars" type="number" min="1" max="100000" step=".01" required value={room.budget ? room.budget / 100 : ""} onChange={e => setRoom({ budget: Math.round(Number(e.target.value) * 100) })} /><span>USD</span></label>;

  if (quickCheck) return <div className="onboarding incoming-check">
    <section className="intro">
      {currentFind && <div className="eyebrow"><Link2 size={15} /> Found via {findSourceLabel(currentFind)}</div>}
      <h1>{sharedDemoProduct?.title ?? "Check this sofa."}</h1>
      <p>{sharedDemoProduct ? `${money(sharedDemoProduct.price)} · ${sharedDemoProduct.variant}` : reference}</p>
      {sharedDemoProduct && <figure className="incoming-product"><img src={sharedDemoProduct.image} alt={sharedDemoProduct.title} /></figure>}
    </section>
    <form className="setup-card" onSubmit={submit}>
      <div className="setup-heading"><h2>Will it work in your space?</h2><p>Check the sofa against the spot you measured and what you can spend.</p></div>
      <fieldset className="discovery-fields" disabled={pending}>
        <legend><Sofa size={16} /> Space for the sofa</legend>
        {measurements}
        <small>Measure the space available after leaving room to walk.</small>
        {mode === "demo" && <button className="sample-measurements" type="button" onClick={() => sampleMeasurements()}>Use sample measurements (80 × 40 in)</button>}
      </fieldset>
      <fieldset disabled={pending}><legend><Wallet size={17} /> Furnishing budget</legend>{budgetInput}</fieldset>
      <div className="quick-photo">
        <input ref={input} type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={changePhoto} tabIndex={-1} />
        <Button variant="outline" disabled={pending || reading} onClick={() => input.current?.click()}>
          <ImagePlus size={16} />{room.photo.startsWith("data:") ? "Change my room photo" : "Add my room photo"}
        </Button>
        <small>{reading ? "Preparing photo…" : room.photo.startsWith("data:") ? "Photo added for the room preview" : "Optional for the fit check"}</small>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <Button className="generate-button" type="submit" disabled={pending || reading}>{pending ? <LoaderCircle size={17} className="animate-spin" /> : <Sparkles size={17} />}{pending ? "Checking sofa…" : "Check sofa fit"}{!pending && <ArrowRight size={16} />}</Button>
      <Button variant="ghost" onClick={() => setShowRoomSetup(true)} disabled={pending}>Edit recommendation or room details</Button>
    </form>
  </div>;

  return <div className="onboarding">
    <section className="intro">
      <div className="eyebrow"><Sparkles size={15} /> ROOMREADY</div>
      <h1>Found a sofa?<br /><em>See if it fits.</em></h1>
      <p>Bring a sofa you found in a chat, a social post, or a message. Check it against your space and see what you can afford around it.</p>
      {mode === "demo" && !inbound && <Link className="button outline shared-find-link" href="/demo/discovery"><Link2 size={16} /> Try an AI recommendation <ArrowRight size={15} /></Link>}
      <figure className="hero-image">
        <img src={sampleRoom} alt="Sunlit living room with a linen sofa, oak flooring and a sculptural coffee table" fetchPriority="high" />
        <figcaption><Images size={14} /> Living room inspiration</figcaption>
      </figure>
    </section>
    <form className="setup-card" onSubmit={submit}>
      <div className="setup-heading"><h2>Check your furniture find</h2><p>Start with a recommendation or plan a room from scratch.</p></div>
      <fieldset className="discovery-fields" disabled={pending}>
        <legend><Link2 size={17} /> Where did you find it?</legend>
        <select aria-label="Recommendation source" value={source} onChange={e => setFindInput({ reference, source: e.target.value as DiscoverySource })}>
          <option value="assistant">AI assistant</option><option value="social">Social post</option><option value="shared">Shared conversation</option>
        </select>
        <label htmlFor="sofa-find">Sofa name, recommendation, or product link <small>Optional</small></label>
        <textarea id="sofa-find" rows={2} maxLength={500} value={reference} onChange={e => {
          setFindInput({ reference: e.target.value, source, platform });
          if (!e.target.value.trim()) setRoom({ sofaSpace: undefined });
        }}
          placeholder="Try this pebble-gray Marlow Low Sofa..." />
        {checkingSofa && <>
          {measurements}
          <small>Measure the space available for the sofa after leaving room to walk.</small>
        </>}
      </fieldset>
      <fieldset disabled={pending}>
        <legend><Camera size={17} /> Room photo {checkingSofa && <small className="muted">Optional</small>}</legend>
        <input ref={input} type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={changePhoto} tabIndex={-1} />
        <button type="button" className={`upload-zone ${dragging ? "dragging" : ""}`} disabled={reading} onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); void upload(e.dataTransfer.files[0]); }}>
          {room.photo ? <img src={room.photo} alt="" className="upload-thumb" /> : <span className="upload-icon"><UploadCloud size={20} /></span>}
          <span><strong>{reading ? "Preparing photo…" : room.photo === sampleRoom ? "Sample room selected" : room.photo ? "Room photo added" : "Click to upload or drag and drop"}</strong>
            <small>{room.photo ? "Click to replace your photo" : "JPG, PNG or WebP up to 12 MB"}</small></span>
          {room.photo && <Check size={17} className="text-accent" />}
        </button>
        <button className="sample-action" type="button" disabled={reading} onClick={() => sampleMeasurements(true)}>
          <ImagePlus size={15} /> Use a sample room <ArrowRight size={13} />
        </button>
        {mode === "live" && aiEnabled && <p className="muted text-xs mt-1">Live mode sends your uploaded photo to the configured AI provider for palette suggestions.</p>}
      </fieldset>
      <fieldset disabled={pending}>
        <legend><Sparkles size={17} /> Design style</legend>
        <div className="style-options">{styles.map((style, i) => {
          const Icon = styleIcons[i];
          return <label className="style-option" key={style}>
            <input className="sr-only" type="radio" name="style" checked={room.style === style} onChange={() => setRoom({ style })} />
            <Icon size={19} /><span>{style}</span>
          </label>;
        })}</div>
      </fieldset>
      <fieldset disabled={pending}>
        <legend><Wallet size={17} /> Furnishing budget</legend>
        {budgetInput}
        <div className="budget-presets">{[100000, 150000, 250000].map(value => <button aria-pressed={room.budget === value} type="button" key={value} onClick={() => setRoom({ budget: value })}>{money(value)}</button>)}</div>
      </fieldset>
      <div className="extras">
        <button type="button" className="extras-toggle" aria-expanded={extras} aria-controls="room-details" onClick={() => setExtras(!extras)}>
          <span>Room measurements &amp; delivery ZIP <small>Optional</small></span><ChevronDown size={17} className={extras ? "rotate-180" : ""} />
        </button>
        {extras && <div className="extras-grid" id="room-details">
          <label>Width (ft)<input type="number" min=".5" max="100" step=".1" value={room.width || ""} onChange={e => setRoom({ width: Number(e.target.value) })} /></label>
          <label>Depth (ft)<input type="number" min=".5" max="100" step=".1" value={room.depth || ""} onChange={e => setRoom({ depth: Number(e.target.value) })} /></label>
          <label>US ZIP<input inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{5}" maxLength={5} value={room.zip} onChange={e => setRoom({ zip: e.target.value })} /></label>
        </div>}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <Button className="generate-button" type="submit" disabled={pending || reading}>{pending ? <LoaderCircle size={17} className="animate-spin" /> : <Sparkles size={17} />}{pending ? "Checking your room…" : checkingSofa ? "Check Sofa & Build Plans" : "Create My Room Setups"}{!pending && <ArrowRight size={16} />}</Button>
    </form>
  </div>;
}
