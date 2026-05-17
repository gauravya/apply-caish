import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CAISH Applications",
  description: "Applications portal for Cambridge AI Safety Hub programmes",
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
