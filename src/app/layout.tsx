import type { Metadata } from "next";
import { Jost, Bodoni_Moda } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import MainWrapper from "@/components/layout/MainWrapper";
import { ToastProvider } from "@/components/ui/Toast";
import { AudioPlayerProvider } from "@/components/audio/AudioPlayerProvider";
import MiniPlayer from "@/components/audio/MiniPlayer";

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
  manifest: "/manifest.json",
  themeColor: "#0a0a0a",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Noirsurblanc" },
  icons: {
    icon: [
      { url: "/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
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
          <AudioPlayerProvider>
            <Sidebar />
            <MainWrapper>{children}</MainWrapper>
            <MiniPlayer />
          </AudioPlayerProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
