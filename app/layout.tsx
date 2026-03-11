import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aethel | Living Literature",
  description: "A curated sanctuary for evolving books.",
};

import Navbar from "@/components/Navbar";
import { I18nProvider } from "@/contexts/I18nContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <I18nProvider>
          <Navbar />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
