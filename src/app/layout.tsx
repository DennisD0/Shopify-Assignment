import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoomReady | Check a sofa before you buy",
  description: "Bring a sofa recommendation from a chat or social post and check it against your space and budget.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
