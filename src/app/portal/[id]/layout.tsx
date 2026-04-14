import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Noirsurblanc — Espace Client",
  description: "Votre espace de gestion de contenu LinkedIn",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--noir)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px 60px 32px' }}>
        {children}
      </div>
    </div>
  );
}
