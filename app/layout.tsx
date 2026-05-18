import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
