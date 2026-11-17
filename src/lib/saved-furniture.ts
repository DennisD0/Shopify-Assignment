"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SocialPlatform } from "./types";

type SavedFurniture = {
  saved: Partial<Record<string, SocialPlatform>>;
  toggle: (productId: string, platform: SocialPlatform) => void;
};

export const useSavedFurniture = create<SavedFurniture>()(persist(set => ({
  saved: {},
  toggle: (productId, platform) => set(state => {
    const saved = { ...state.saved };
    if (saved[productId]) delete saved[productId];
    else saved[productId] = platform;
    return { saved };
  }),
}), { name: "roomready-saved-sofas", skipHydration: true, partialize: ({ saved }) => ({ saved }) }));
