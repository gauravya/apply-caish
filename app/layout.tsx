import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

// Retro pixel display face for the public pages' titles.
const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

// Terminal face for retro body text / buttons.
const terminal = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-terminal",
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
    <html lang="en" className={`${pixel.variable} ${terminal.variable}`}>
      <body>{children}</body>
    </html>
  );
}
