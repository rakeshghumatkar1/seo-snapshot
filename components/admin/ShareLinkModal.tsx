'use client'

import { useEffect, useState } from 'react'

type SharePayload = {
  active: boolean
  publicUrl?: string
  createdAt?: string
  accessCount?: number
}

export default function ShareLinkModal({
  reportId,
  hostLabel,
  hasPdf,
  initiallyShared,
  onClose,
  onChanged,
}: {
  reportId: string
  hostLabel: string
  hasPdf: boolean
  initiallyShared: boolean
  onClose: () => void
  onChanged: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [share, setShare] = useState<SharePayload>({ active: initiallyShared })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/admin/pdf-shares?reportId=${encodeURIComponent(reportId)}`,
          { cache: 'no-store' }
        )
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load share status')
        if (!cancelled) {
          setShare({
            active: Boolean(data.active),
            publicUrl: data.publicUrl,
            createdAt: data.createdAt,
            accessCount: data.accessCount,
          })
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load share status')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reportId])

  async function createLink() {
    if (!hasPdf) {
      setError('PDF is not stored yet. Open/create the PDF first.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/pdf-shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', reportId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create share link')
      setShare({
        active: true,
        publicUrl: data.publicUrl,
        createdAt: data.createdAt,
        accessCount: 0,
      })
      onChanged()
    } catch (err: any) {
      setError(err?.message || 'Could not create share link')
    } finally {
      setBusy(false)
    }
  }

  async function copyLink() {
    if (!share.publicUrl) return
    try {
      await navigator.clipboard.writeText(share.publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy to clipboard')
    }
  }

  async function revokeLink() {
    if (
      !window.confirm(
        'Revoke this public PDF link?\n\nAnyone using the link will immediately lose access.\nThe report and stored PDF will NOT be deleted.'
      )
    ) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/pdf-shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke', reportId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not revoke share link')
      setShare({ active: false })
      onChanged()
    } catch (err: any) {
      setError(err?.message || 'Could not revoke share link')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
      <div className="admin-modal" style={{ maxWidth: 520 }}>
        <div className="admin-modal-title">
          {share.active ? 'Public Link Active' : 'Public PDF Link'}
        </div>
        <p className="admin-subtitle" style={{ marginTop: 4 }}>
          {hostLabel}
        </p>

        {loading ? (
          <div className="admin-empty">
            <div className="loader" />
          </div>
        ) : (
          <>
            {!hasPdf ? (
              <div className="admin-alert admin-alert-error">
                PDF is not stored yet. Open/create the PDF first.
              </div>
            ) : null}

            {share.active && share.publicUrl ? (
              <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                <label className="admin-field">
                  <span>Public PDF Link</span>
                  <input className="admin-input" readOnly value={share.publicUrl} />
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    disabled={busy}
                    onClick={copyLink}
                  >
                    {copied ? 'Copied' : 'Copy Link'}
                  </button>
                  <a
                    className="admin-btn admin-btn-secondary"
                    href={share.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open PDF
                  </a>
                  <button
                    type="button"
                    className="admin-btn admin-btn-danger"
                    disabled={busy}
                    onClick={revokeLink}
                  >
                    Revoke Link
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 13, color: 'var(--t-400)', marginBottom: 12 }}>
                  Create a public browser link that opens this stored PDF without Admin login.
                </p>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  disabled={busy || !hasPdf}
                  onClick={createLink}
                >
                  {busy ? 'Creating…' : 'Create Public Link'}
                </button>
              </div>
            )}

            {error ? <div className="admin-alert admin-alert-error" style={{ marginTop: 12 }}>{error}</div> : null}
          </>
        )}

        <div className="admin-modal-footer">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
