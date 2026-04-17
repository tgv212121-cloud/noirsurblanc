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
      <div style={{ padding: '32px 60px 120px 60px' }}>{children}</div>
    </main>
  )
}
