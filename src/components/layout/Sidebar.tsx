'use client'

import { usePathname } from 'next/navigation'
import { FloatingDock } from '@/components/ui/FloatingDock'

export default function Sidebar() {
  const pathname = usePathname()

  const publicPaths = ['/portal', '/onboarding', '/login', '/forgot-password', '/reset-password', '/mentions-legales', '/confidentialite', '/cgu', '/rdv', '/book']
  if (publicPaths.some(p => pathname.startsWith(p))) return null

  const items = [
    {
      title: 'Accueil',
      href: '/',
      activeColor: '#3b82f6',
      icon: (
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '22%',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 60%, #1d4ed8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
        }}>
          <svg width="62%" height="62%" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1.2" />
            <rect x="14" y="3" width="7" height="5" rx="1.2" />
            <rect x="14" y="12" width="7" height="9" rx="1.2" />
            <rect x="3" y="16" width="7" height="5" rx="1.2" />
          </svg>
        </div>
      ),
    },
    {
      title: 'Clients',
      href: '/clients',
      activeColor: '#a855f7',
      icon: (
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '22%',
          background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 60%, #6d28d9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(168,85,247,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
        }}>
          <svg width="64%" height="64%" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
      ),
    },
    {
      title: 'Paramètres',
      href: '/settings',
      activeColor: '#ca8a04',
      icon: (
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '22%',
          background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 60%, #a16207 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(202,138,4,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
        }}>
          <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
      ),
    },
  ]

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <FloatingDock items={items} />
    </div>
  )
}
