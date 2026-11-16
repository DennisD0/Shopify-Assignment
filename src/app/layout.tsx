import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoomReady | Furnish a room you’ll love",
  description: "Turn one room, one style, and one budget into a shoppable living room.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
