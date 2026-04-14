import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Noirsurblanc",
  description: "Plateforme de gestion de contenu LinkedIn",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`h-full ${jost.variable}`}>
      <body className="h-full">
        <Sidebar />
        <main style={{ minHeight: '100vh' }}>
          <div style={{ padding: '32px 60px 120px 60px' }}>
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
