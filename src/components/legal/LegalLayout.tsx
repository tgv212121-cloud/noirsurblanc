'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function LegalLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 -left-60 w-[800px] h-[800px] rounded-full blur-[200px]" style={{ background: 'radial-gradient(circle, rgba(201,169,97,0.08), transparent 70%)' }} />
        <div className="absolute -bottom-60 -right-60 w-[900px] h-[900px] rounded-full blur-[220px]" style={{ background: 'radial-gradient(circle, rgba(201,169,97,0.05), transparent 70%)' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
      </div>

      <div className="relative z-10" style={{ padding: '60px 24px 120px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto"
          style={{ maxWidth: '760px' }}
        >
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-blanc-muted/60 hover:text-gold transition-colors" style={{ marginBottom: '40px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            Accueil
          </Link>

          <h1 className="font-heading font-medium text-blanc leading-none" style={{ fontSize: 'clamp(40px, 6vw, 56px)', marginBottom: '14px' }}>
            {title}
          </h1>
          <p className="text-blanc-muted/70 text-sm" style={{ marginBottom: '56px' }}>{subtitle}</p>

          <div className="legal-content text-[15px] text-blanc-muted leading-[1.8]">
            {children}
          </div>

          <div className="text-center text-[11px] text-blanc-muted/40 uppercase tracking-[0.3em]" style={{ marginTop: '80px' }}>
            Noirsurblanc
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        .legal-content h2 {
          font-family: 'Bodoni Moda', Georgia, serif;
          font-style: italic;
          color: #fafaf9;
          font-size: 26px;
          font-weight: 500;
          margin-top: 48px;
          margin-bottom: 16px;
          line-height: 1.25;
        }
        .legal-content h3 {
          color: #fafaf9;
          font-size: 16px;
          font-weight: 600;
          margin-top: 28px;
          margin-bottom: 10px;
        }
        .legal-content p { margin-bottom: 16px; }
        .legal-content ul { margin-bottom: 16px; padding-left: 20px; }
        .legal-content li { margin-bottom: 8px; }
        .legal-content li::marker { color: #ca8a04; }
        .legal-content strong { color: #fafaf9; font-weight: 600; }
        .legal-content a { color: #ca8a04; text-decoration: underline; text-underline-offset: 3px; }
        .legal-content a:hover { color: #eab308; }
      `}</style>
    </div>
  )
}
