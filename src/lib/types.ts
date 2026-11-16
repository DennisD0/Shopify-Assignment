export const categories = ["sofa", "table", "rug", "lamp", "storage"] as const;
export type Category = (typeof categories)[number];
export const categoryNames: Record<Category, string> = {
  sofa: "Sofa", table: "Coffee table", rug: "Area rug", lamp: "Floor lamp", storage: "Media console",
};
export const styles = ["Modern Minimalist", "Scandinavian", "Cozy Contemporary"] as const;
export type Style = (typeof styles)[number];
export type Mode = "demo" | "live";
export type Strategy = "similar" | "save" | "explore";
export type Product = {
  id: string;
  variantId: string;
  variant: string;
  category: Category;
  title: string;
  merchant: string;
  merchantOrigin?: string;
  price: number;
  image: string;
  styles: Style[];
  available: boolean;
  dimensions?: { width: number; depth: number };
};
export type Line = { product: Product; quantity: number; locked: boolean };
export type Room = {
  photo: string;
  style: Style;
  budget: number;
  width: number;
  depth: number;
  zip: string;
};
export type Concept = {
  id: string; name: string; description: string; photo: string; lines: Line[];
};
export type Inventory = Record<Category, Product[]>;
export type RoomResult = { concepts: Concept[]; inventory: Inventory; designNote?: string };
