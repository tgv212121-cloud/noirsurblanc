'use client'

import { usePathname } from 'next/navigation'

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const publicPaths = ['/portal', '/onboarding', '/login', '/forgot-password', '/reset-password', '/mentions-legales', '/confidentialite', '/cgu', '/rdv', '/book']
  const fullBleed = publicPaths.some(p => pathname.startsWith(p))

  if (fullBleed) {
    return <main style={{ minHeight: '100vh' }}>{children}</main>
  }

  return (
    <main style={{ minHeight: '100vh' }}>
      <div style={{
        paddingLeft: 'clamp(16px, 4vw, 56px)',
        paddingRight: 'clamp(16px, 4vw, 56px)',
        paddingTop: 'clamp(20px, 3vw, 36px)',
        paddingBottom: 'clamp(80px, 8vw, 110px)',
      }}>{children}</div>
    </main>
  )
}
