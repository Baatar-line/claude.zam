import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Зам",
  description: "Монгол сурагчдад зориулсан мэргэжил сонголтын платформ.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The page is light by design (§1): it has to stay readable in daylight,
  // in a classroom, on a cheap phone screen.
  themeColor: "#FAFAF8",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // lang="mn" is an accessibility requirement, not a detail: it tells a
  // screen reader which language to pronounce the Cyrillic in (§1).
  return (
    <html lang="mn">
      <body>{children}</body>
    </html>
  );
}
