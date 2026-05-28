import type { Metadata } from "next";
import { Press_Start_2P, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Retro pixel display face — public-page titles only (the fun signature).
const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

// Readable monospace for all body text — keeps the retro-computer feel
// without VT323's legibility cost on login and data pages.
const mono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CAISH Applications",
    template: "%s",
  },
  description: "Applications portal for Cambridge AI Safety Hub programmes.",
  openGraph: {
    title: "CAISH Applications",
    description: "Applications portal for Cambridge AI Safety Hub programmes.",
    url: "https://application.caish.org",
    siteName: "CAISH Applications",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${pixel.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
