"use client";

import { useState, type ChangeEvent } from "react";
import { ImagePlus } from "lucide-react";
import { useRoom } from "@/lib/store";
import { Button, Panel } from "./ui";

async function preparePhoto(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 12_000_000) {
    throw new Error("Choose a JPG, PNG, or WebP image under 12 MB.");
  }
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
  } finally {
    bitmap.close();
  }
}

export function RoomPreferences({ onClose, onPhoto }: { onClose: () => void; onPhoto: () => void }) {
  const { room, setRoom } = useRoom();
  const [budget, setBudget] = useState(String(room.budget / 100));
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);

  async function changePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setReading(true);
    setError("");
    try {
      setRoom({ photo: await preparePhoto(file) });
      onPhoto();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Couldn’t open the photo.");
    } finally {
      setReading(false);
    }
  }

  return <Panel title="Room preferences" description="Update your budget and room photo from Customize." onClose={onClose}>
    <form className="room-preferences" onSubmit={event => {
      event.preventDefault();
      setRoom({ budget: Math.round(Number(budget) * 100) });
      onClose();
    }}>
      <label>Furniture budget ($)<input required type="number" min="1" max="100000" step=".01" value={budget} onChange={event => setBudget(event.target.value)} /></label>
      <label><span><ImagePlus size={16} /> {room.photo.startsWith("data:") ? "Replace room photo" : "Add room photo"}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={reading} onChange={event => void changePhoto(event)} />
      </label>
      {reading && <p role="status">Preparing photo…</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {(room.width || room.depth || room.sofaSpace) && <Button variant="ghost" type="button" onClick={() => setRoom({ width: 0, depth: 0, sofaSpace: undefined })}>Clear saved room measurements</Button>}
      <Button type="submit" disabled={reading}>Save preferences</Button>
    </form>
  </Panel>;
}
