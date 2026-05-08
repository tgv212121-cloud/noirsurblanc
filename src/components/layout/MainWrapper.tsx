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
      <div className="px-4 sm:px-8 md:px-12 lg:px-[60px] pt-6 sm:pt-8 pb-24 sm:pb-28 lg:pb-[120px]">{children}</div>
    </main>
  )
}
