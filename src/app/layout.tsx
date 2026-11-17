import type { Metadata } from "next";
import { Suspense } from "react";
import { AppNavigation } from "@/components/app-navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoomReady | Furnish your first place in stages",
  description: "Discover furniture, compare delivered prices and arrival estimates, and decide what to buy now or later.",
  icons: { icon: "/roomready-mark.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<Suspense fallback={null}><AppNavigation /></Suspense></body></html>;
}
