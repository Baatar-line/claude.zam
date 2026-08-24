import type { Metadata, Viewport } from "next";
import { Noto_Sans } from "next/font/google";

import "./globals.css";

/**
 * Self-hosted by next/font — no runtime request to Google, so the classroom
 * / cheap-phone / slow-connection requirement (§1) holds even for the font.
 * Cyrillic subsets are what the product actually renders; latin covers the
 * odd English word in developer-facing chrome.
 */
const notoSans = Noto_Sans({
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto",
  display: "swap",
});

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
    <html lang="mn" className={notoSans.variable}>
      <body>{children}</body>
    </html>
  );
}
