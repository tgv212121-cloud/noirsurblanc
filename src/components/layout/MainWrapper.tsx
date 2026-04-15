'use client'

import { usePathname } from 'next/navigation'

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const fullBleed = pathname.startsWith('/onboarding') || pathname.startsWith('/portal')

  if (fullBleed) {
    return <main style={{ minHeight: '100vh' }}>{children}</main>
  }

  return (
    <main style={{ minHeight: '100vh' }}>
      <div style={{ padding: '32px 60px 120px 60px' }}>{children}</div>
    </main>
  )
}
