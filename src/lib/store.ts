"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyOptimization, fits, swapLine, type optimize } from "./budget";
import { demoInventory } from "./demo";
import type { DemoDeliveryOption } from "./demo-delivery";
import type { Concept, Line, Mode, Product, Room, RoomResult, FurnitureFind } from "./types";

export const sampleRoom = "/images/room.webp";
export const initialRoom: Room = { photo: "", style: "Modern Minimalist", budget: 150000, width: 0, depth: 0, zip: "" };
type Page = 0 | 1 | 2 | 3;
type Draft = {
  room: Room; mode: Mode; page: Page; result?: RoomResult; concept?: Concept; lines: Line[]; previous?: Line[]; generatedAt?: number;
  excludedFromCart: string[];
  demoDeliverySelections: Partial<Record<string, DemoDeliveryOption>>;
  findInput?: FurnitureFind;
  setRoom: (room: Partial<Room>) => void;
  setMode: (mode: Mode) => void;
  navigate: (page: Page) => void;
  startDraft: (result: RoomResult, product?: Product, find?: FurnitureFind) => void;
  openFind: (product: Product, find: FurnitureFind) => void;
  expireLivePrices: () => void;
  placeProduct: (product: Product) => void;
  removePiece: (id: string) => void;
  swap: (id: string, p: Product) => void;
  lock: (id: string) => void;
  removeFromCart: (id: string) => void;
  restoreToCart: (id: string) => void;
  setDemoDelivery: (merchant: string, option: DemoDeliveryOption) => void;
  applyPurchasePlan: (lines: Line[], deferred: string[], zip: string, selections: Draft["demoDeliverySelections"]) => void;
  undo: () => void;
  optimize: (proposal: ReturnType<typeof optimize>) => void;
};
type SavedDraft = Pick<Draft, "room" | "mode" | "page" | "result" | "concept" | "lines" | "findInput"> &
  Partial<Pick<Draft, "excludedFromCart" | "demoDeliverySelections">>;

function applyLines(draft: Draft, lines: Line[]) {
  const deferredCategories = new Set(draft.lines
    .filter(({ product }) => draft.excludedFromCart.includes(product.variantId))
    .map(({ product }) => product.category));
  return {
    lines,
    excludedFromCart: lines.filter(({ product }) => deferredCategories.has(product.category) ||
      draft.excludedFromCart.includes(product.variantId)).map(({ product }) => product.variantId),
  };
}

function placeProduct(draft: Draft, product: Product) {
  if (!product.available || fits(product, draft.room) === false) return {};
  const current = draft.lines.find(line => line.product.category === product.category);
  if (current?.product.variantId === product.variantId) return {};
  const lines = current ? swapLine(draft.lines, current.product.variantId, product) : [
    ...draft.lines, { product, quantity: 1, locked: false },
  ];
  return { ...applyLines(draft, lines), previous: draft.lines };
}

function migrateDemoDraft(state: unknown): SavedDraft {
  const draft = state as SavedDraft;
  if (draft.mode !== "demo") return draft;

  function updateMerchant(product: Product) {
    const current = demoInventory[product.category].find(item => item.variantId === product.variantId);
    return current ? { ...product, merchant: current.merchant } : product;
  }

  function updateLines(lines: Line[]) {
    return lines.map(line => ({ ...line, product: updateMerchant(line.product) }));
  }
  function updateConcept(concept: Concept): Concept {
    return { ...concept, lines: updateLines(concept.lines) };
  }

  const decision = draft.result?.decision;
  const { "Juniper House": previousDelivery, ...selections } = draft.demoDeliverySelections ?? {};
  if (previousDelivery && !selections["Merchant 3"]) selections["Merchant 3"] = previousDelivery;
  const plannedPurchases = Boolean(draft.excludedFromCart?.length || Object.keys(selections).length);
  const starterLines = draft.concept?.lines ?? [];
  const lines = plannedPurchases ? draft.lines : draft.lines.filter(line => line.locked ||
    !starterLines.some(starter => starter.product.variantId === line.product.variantId && starter.quantity === line.quantity));
  return {
    ...draft,
    demoDeliverySelections: selections,
    lines: updateLines(lines),
    concept: draft.concept && updateConcept(draft.concept),
    result: draft.result && {
      ...draft.result, inventory: demoInventory, concepts: draft.result.concepts.map(updateConcept),
      decision: decision && {
        ...decision, found: updateMerchant(decision.found),
        recommended: decision.recommended && updateMerchant(decision.recommended),
      },
    },
  };
}
export const useRoom = create<Draft>()(persist((set) => ({
  room: initialRoom, mode: "demo", page: 0, lines: [], excludedFromCart: [], demoDeliverySelections: {},
  setRoom: (room) => set(s => ({ room: { ...s.room, ...room } })),
  setMode: (mode) => set(s => s.mode === mode ? s : { mode, page: 0, result: undefined, concept: undefined, lines: [], excludedFromCart: [], previous: undefined, generatedAt: undefined, findInput: undefined }),
  navigate: (page) => set({ page }),
  startDraft: (result, product, findInput) => set({
    result,
    concept: { id: "my-room", name: "My room", photo: sampleRoom, description: "", lines: [] },
    lines: product?.available ? [{ product, quantity: 1, locked: false }] : [],
    page: 2, findInput, excludedFromCart: [], demoDeliverySelections: {}, previous: undefined, generatedAt: Date.now(),
  }),
  openFind: (product, findInput) => set(s => ({ page: 2, findInput, ...placeProduct(s, product) })),
  expireLivePrices: () => set({ page: 0, result: undefined, concept: undefined, lines: [], excludedFromCart: [], previous: undefined }),
  placeProduct: (product) => set(s => placeProduct(s, product)),
  removePiece: (id) => set(s => ({ previous: s.lines, lines: s.lines.filter(line => line.product.variantId !== id) })),
  swap: (id, product) => set(s => fits(product, s.room) === false ? s : ({
    previous: s.lines, ...applyLines(s, swapLine(s.lines, id, product)),
  })),
  removeFromCart: (id) => set(s => s.excludedFromCart.includes(id) ? s : { excludedFromCart: [...s.excludedFromCart, id] }),
  restoreToCart: (id) => set(s => ({ excludedFromCart: s.excludedFromCart.filter(excluded => excluded !== id) })),
  setDemoDelivery: (merchant, option) => set(s => ({ demoDeliverySelections: { ...s.demoDeliverySelections, [merchant]: option } })),
  applyPurchasePlan: (lines, excludedFromCart, zip, demoDeliverySelections) => set(s => ({
    lines, excludedFromCart, demoDeliverySelections, room: { ...s.room, zip }, previous: undefined,
  })),
  lock: (id) => set(s => ({
    lines: s.lines.map(line => line.product.variantId === id ? { ...line, locked: !line.locked } : line),
    previous: s.previous?.map(previous => {
      const current = s.lines.find(line => line.product.category === previous.product.category);
      return current?.product.variantId === id ? { ...previous, locked: !current.locked } : previous;
    }),
  })),
  undo: () => set(s => s.previous ? { ...applyLines(s, s.previous), previous: undefined } : s),
  optimize: (proposal) => set(s => ({ previous: s.lines, ...applyLines(s, applyOptimization(s.lines, proposal)) })),
}), { name: "roomready-draft-v1", version: 4, migrate: migrateDemoDraft, skipHydration: true, partialize: ({ room, mode, page, result, concept, lines, excludedFromCart, findInput, demoDeliverySelections }) =>
  mode === "live" ? { room, mode, page: 0 as const, lines: [] } : { room, mode, page, result, concept, lines, excludedFromCart, findInput, demoDeliverySelections },
}));
