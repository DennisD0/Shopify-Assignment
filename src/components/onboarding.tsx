"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowRight, Camera, Check, ChevronDown, ImagePlus, Images, Leaf, LoaderCircle, ScanLine, Sofa, Sparkles, UploadCloud, Wallet } from "lucide-react";
import { styles, type RoomResult } from "@/lib/types";
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

export function Onboarding({ aiEnabled }: { aiEnabled: boolean }) {
  const { room, mode, setRoom, generated } = useRoom();
  const input = useRef<HTMLInputElement>(null);
  const generation = useRef<AbortController | null>(null);
  const [extras, setExtras] = useState(Boolean(room.width || room.depth || room.zip));
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
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
    if (!room.photo) { setError("Upload a room photo or choose the sample room."); return; }
    if (Boolean(room.width) !== Boolean(room.depth)) {
      setExtras(true); setError("Enter both room measurements or leave them blank."); return;
    }
    setPending(true);
    setError("");
    const controller = new AbortController();
    generation.current = controller;
    try {
      const response = await fetch("/api/concepts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ room, mode }), signal: controller.signal });
      const result: RoomResult & { error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error || "Couldn’t create your room setups.");
      if (!controller.signal.aborted && useRoom.getState().mode === mode) generated(result);
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Couldn’t create your room setups.");
    } finally {
      if (generation.current === controller) { generation.current = null; setPending(false); }
    }
  }
  return <div className="onboarding">
    <section className="intro">
      <div className="eyebrow"><Sparkles size={15} /> THE ROOM DESIGN STUDIO</div>
      <h1>Make room for<br /><em>better living.</em></h1>
      <p>Upload your room. Choose your look. Make it yours. Stay on budget.</p>
      <figure className="hero-image">
        <img src={sampleRoom} alt="Sunlit living room with a linen sofa, oak flooring and a sculptural coffee table" fetchPriority="high" />
        <figcaption><Images size={14} /> Living room inspiration</figcaption>
      </figure>
    </section>
    <form className="setup-card" onSubmit={submit}>
      <div className="setup-heading"><h2>Tell us about your room</h2><p>We’ll find three shoppable setups for your space.</p></div>
      <fieldset disabled={pending}>
        <legend><Camera size={17} /> Room photo</legend>
        <input ref={input} type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={changePhoto} tabIndex={-1} />
        <button type="button" className={`upload-zone ${dragging ? "dragging" : ""}`} disabled={reading} onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); void upload(e.dataTransfer.files[0]); }}>
          {room.photo ? <img src={room.photo} alt="" className="upload-thumb" /> : <span className="upload-icon"><UploadCloud size={20} /></span>}
          <span><strong>{reading ? "Preparing photo…" : room.photo === sampleRoom ? "Sample room selected" : room.photo ? "Room photo added" : "Click to upload or drag and drop"}</strong>
            <small>{room.photo ? "Click to replace your photo" : "JPG, PNG or WebP up to 12 MB"}</small></span>
          {room.photo && <Check size={17} className="text-accent" />}
        </button>
        <button className="sample-action" type="button" disabled={reading} onClick={() => { setRoom({ photo: sampleRoom }); setError(""); }}>
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
        <label className="currency-field"><span>$</span><input aria-label="Furnishing budget in US dollars" type="number" min="1" max="100000" step=".01" required value={room.budget ? room.budget / 100 : ""} onChange={e => setRoom({ budget: Math.round(Number(e.target.value) * 100) })} /><span>USD</span></label>
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
      <Button className="generate-button" type="submit" disabled={pending || reading}>{pending ? <LoaderCircle size={17} className="animate-spin" /> : <Sparkles size={17} />}{pending ? "Curating your room…" : "Create My Room Setups"}{!pending && <ArrowRight size={16} />}</Button>
    </form>
  </div>;
}
