import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LibroVivo | Living Literature",
  description: "A curated sanctuary for evolving books.",
};

import Navbar from "@/components/Navbar";
import { I18nProvider } from "@/contexts/I18nContext";
import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <I18nProvider>
            <Navbar />
            {children}
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
