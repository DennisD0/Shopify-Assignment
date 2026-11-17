"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Bookmark, House, LayoutGrid } from "lucide-react";
import { useSavedFurniture } from "@/lib/saved-furniture";
import { RoomReadyBrand } from "./roomready-brand";

const destinations = [
  { id: "home", label: "Home", href: "/", icon: House },
  { id: "saved", label: "Saved", href: "/saved", icon: Bookmark },
  { id: "room", label: "My room", href: "/?setup=1", icon: LayoutGrid },
];

export function AppNavigation() {
  const pathname = usePathname();
  const search = useSearchParams();
  const current = pathname === "/saved" ? "saved" :
    pathname === "/" && (search.has("find") || search.get("setup") === "1") ? "room" : "home";

  useEffect(() => {
    const storage = useSavedFurniture.persist;
    if (storage && !storage.hasHydrated()) void storage.rehydrate();
  }, []);

  return <nav className="app-nav" aria-label="Main navigation">
    <RoomReadyBrand rail />
    <div className="nav-destinations">
      {destinations.map(({ id, label, href, icon: Icon }) => <Link className="nav-destination" key={id} href={href}
        aria-label={label} aria-current={current === id ? "page" : undefined}>
        <Icon size={21} strokeWidth={current === id ? 2.25 : 1.75} aria-hidden="true" /><span>{label}</span>
      </Link>)}
    </div>
  </nav>;
}
