"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyOptimization, fits, swapLine, type optimize } from "./budget";
import type { Concept, Line, Mode, Product, Room, RoomResult } from "./types";

export const sampleRoom = "/images/room.webp";
export const initialRoom: Room = { photo: "", style: "Modern Minimalist", budget: 150000, width: 0, depth: 0, zip: "" };
type Page = 0 | 1 | 2 | 3;
type Draft = {
  room: Room; mode: Mode; page: Page; result?: RoomResult; concept?: Concept; lines: Line[]; previous?: Line[]; generatedAt?: number;
  setRoom: (room: Partial<Room>) => void;
  setMode: (mode: Mode) => void;
  navigate: (page: Page) => void;
  generated: (result: RoomResult) => void;
  expireLivePrices: () => void;
  choose: (concept: Concept) => void;
  swap: (id: string, p: Product) => void;
  lock: (id: string) => void;
  undo: () => void;
  optimize: (proposal: ReturnType<typeof optimize>) => void;
};
export const useRoom = create<Draft>()(persist((set) => ({
  room: initialRoom, mode: "demo", page: 0, lines: [],
  setRoom: (room) => set(s => ({ room: { ...s.room, ...room } })),
  setMode: (mode) => set(s => s.mode === mode ? s : { mode, page: 0, result: undefined, concept: undefined, lines: [], previous: undefined, generatedAt: undefined }),
  navigate: (page) => set({ page }),
  generated: (result) => set({ result, page: 1, concept: undefined, lines: [], previous: undefined, generatedAt: Date.now() }),
  expireLivePrices: () => set({ page: 0, result: undefined, concept: undefined, lines: [], previous: undefined }),
  choose: (concept) => set(s => s.concept?.id === concept.id ? { page: 2 } : { concept, lines: concept.lines, page: 2, previous: undefined }),
  swap: (id, product) => set(s => fits(product, s.room) === false ? s : ({
    previous: s.lines, lines: swapLine(s.lines, id, product),
  })),
  lock: (id) => set(s => ({
    lines: s.lines.map(line => line.product.variantId === id ? { ...line, locked: !line.locked } : line),
    previous: s.previous?.map(previous => {
      const current = s.lines.find(line => line.product.category === previous.product.category);
      return current?.product.variantId === id ? { ...previous, locked: !current.locked } : previous;
    }),
  })),
  undo: () => set(s => s.previous ? { lines: s.previous, previous: undefined } : s),
  optimize: (proposal) => set(s => ({ previous: s.lines, lines: applyOptimization(s.lines, proposal) })),
}), { name: "roomready-draft-v1", skipHydration: true, partialize: ({ room, mode, page, result, concept, lines }) =>
  mode === "live" ? { room, mode, page: 0 as const, lines: [] } : { room, mode, page, result, concept, lines },
}));
