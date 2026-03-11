import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aethel | Living Literature",
  description: "A curated sanctuary for evolving books.",
};

import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
