import type { Metadata } from "next";
import { Jost, Bodoni_Moda } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import MainWrapper from "@/components/layout/MainWrapper";
import { ToastProvider } from "@/components/ui/Toast";

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
    <html lang="fr" className={`h-full ${jost.variable} ${bodoni.variable}`}>
      <body className="h-full">
        <ToastProvider>
          <Sidebar />
          <MainWrapper>{children}</MainWrapper>
        </ToastProvider>
      </body>
    </html>
  );
}
