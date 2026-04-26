'use client'

import { useEffect, useState } from 'react'
import { fetchPostHistory, type PostVersion } from '@/lib/queries'
import AnnotatedPostContent from './AnnotatedPostContent'

const IMG_RE = /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)(\?|$)/i

type Props = {
  postId: string
  clientId: string
  readOnly?: boolean // true = admin (ne peut pas creer de commentaires)
  // Slot d'actions a afficher en bas du card de la version actuelle (ex : Copier pour LinkedIn + Valider)
  actionsForCurrent?: React.ReactNode
}

function formatVersionDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

export default function VersionedPostView({ postId, clientId, readOnly = false, actionsForCurrent }: Props) {
  const [versions, setVersions] = useState<PostVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let mounted = true
    fetchPostHistory(postId).then(v => { if (mounted) { setVersions(v); setLoading(false) } })
    return () => { mounted = false }
  }, [postId, reloadKey])

  if (loading) return <div className="text-sm text-blanc-muted">Chargement…</div>
  if (versions.length === 0) return null

  // versions est deja trie par version DESC (la plus recente en premier)
  return (
    <div className="flex flex-col" style={{ gap: '24px' }}>
      {versions.map((v, idx) => {
        const isCurrent = idx === 0
        const images = v.files.filter(f => IMG_RE.test(f.url) || IMG_RE.test(f.name))
        const otherFiles = v.files.filter(f => !(IMG_RE.test(f.url) || IMG_RE.test(f.name)))
        return (
          <div
            key={v.id}
            className="rounded-2xl"
            style={{
              padding: '24px 26px',
              background: isCurrent ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)',
              border: isCurrent ? '1px solid rgba(202,138,4,0.25)' : '1px solid rgba(255,255,255,0.06)',
              opacity: isCurrent ? 1 : 0.85,
            }}
          >
            {/* Bandeau version */}
            <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: '18px' }}>
              <span
                className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider rounded-full"
                style={{
                  padding: '4px 10px',
                  background: isCurrent ? 'rgba(202,138,4,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isCurrent ? 'rgba(202,138,4,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  color: isCurrent ? '#ca8a04' : 'rgba(255,255,255,0.55)',
                  fontWeight: 600,
                }}
              >
                {isCurrent && <span className="inline-block rounded-full" style={{ width: '5px', height: '5px', background: '#ca8a04', boxShadow: '0 0 8px rgba(202,138,4,0.5)' }} />}
                Version {v.version}{isCurrent ? ' · actuelle' : ''}
              </span>
              <span className="text-[11px] text-blanc-muted/60">{formatVersionDate(v.createdAt)}</span>
            </div>

            {/* Contenu + annotations propres a cette version */}
            <AnnotatedPostContent
              postId={postId}
              clientId={clientId}
              content={v.content}
              readOnly={readOnly}
              version={v.version}
              canComment={isCurrent}
            />

            {/* Images */}
            {images.length > 0 && (
              <div className={`grid gap-2 mt-5 ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
                {images.map((f, i) => (
                  <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)', aspectRatio: images.length === 1 ? '16 / 10' : '1 / 1' }}>
                    <img src={f.url} alt={f.name} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
                  </a>
                ))}
              </div>
            )}
            {otherFiles.length > 0 && (
              <div className="flex flex-col gap-2 mt-4">
                {otherFiles.map((f, i) => (
                  <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg" style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <p className="text-sm text-blanc truncate flex-1">{f.name}</p>
                  </a>
                ))}
              </div>
            )}

            {/* Actions (Copier / Valider) uniquement sur la version actuelle */}
            {isCurrent && actionsForCurrent && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {actionsForCurrent}
              </div>
            )}
          </div>
        )
      })}

      {/* Trigger refetch (utile apres edition admin) */}
      <span data-reload-trigger style={{ display: 'none' }} onClick={() => setReloadKey(k => k + 1)} />
    </div>
  )
}
