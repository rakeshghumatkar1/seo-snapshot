'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminEmptyState from '@/components/admin/AdminEmptyState'

type RateRow = {
  identifier: string
  requests: number
  limit: number
  status: 'normal' | 'near' | 'limited'
  lastActivityAt: string
  resetAt: string
}

type Summary = {
  requestsToday: number
  uniqueIpsToday: number
  currentlyLimited: number
  limit: number
  windowHours: number
  activeWindows: number
}

function formatDate(value: string) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusBadge(status: RateRow['status']) {
  if (status === 'limited') return { label: 'Limited', className: 'admin-badge admin-badge-danger' }
  if (status === 'near') return { label: 'Near Limit', className: 'admin-badge admin-badge-warn' }
  return { label: 'Normal', className: 'admin-badge admin-badge-success' }
}

export default function RateLimitsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<RateRow[]>([])
  const [summary, setSummary] = useState<Summary>({
    requestsToday: 0,
    uniqueIpsToday: 0,
    currentlyLimited: 0,
    limit: 20,
    windowHours: 24,
    activeWindows: 0,
  })

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/admin/rate-limits', { cache: 'no-store' })
        if (res.status === 401) {
          router.push('/admin')
          return
        }
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load rate limits')
        setRows(data.rows || [])
        if (data.summary) setSummary(data.summary)
      } catch (err: any) {
        setError(err?.message || 'Failed to load rate limits')
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  return (
    <main className="admin-page">
      <AdminPageHeader
        eyebrow="ADMIN · TOOLS"
        title="Rate Limits"
        subtitle="Operational view of request windows and currently limited identifiers."
      />

      <div className="admin-summary-grid">
        {[
          { label: 'Requests Today', value: summary.requestsToday },
          { label: 'Unique Users Today', value: summary.uniqueIpsToday },
          { label: 'Currently Limited', value: summary.currentlyLimited },
          { label: 'Current Limit', value: `${summary.limit}/${summary.windowHours}h` },
        ].map((card) => (
          <div key={card.label} className="admin-summary-card admin-summary-card-static">
            <span className="admin-summary-label">{card.label}</span>
            <span className="admin-summary-value">{card.value}</span>
          </div>
        ))}
      </div>

      {error ? <div className="admin-alert admin-alert-danger">{error}</div> : null}

      <div className="admin-panel">
        <div className="admin-table-meta">
          Active windows: {summary.activeWindows} · Status uses ≥80% = Near Limit, ≥limit = Limited
        </div>

        {loading ? (
          <div className="admin-loading">
            <div className="loader" />
          </div>
        ) : summary.currentlyLimited === 0 && rows.length === 0 ? (
          <AdminEmptyState
            title="No users are currently rate limited."
            body="Active request windows will appear here when traffic is present."
          />
        ) : rows.length === 0 ? (
          <AdminEmptyState title="No active rate-limit windows." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Identifier</th>
                  <th>Requests</th>
                  <th>Limit</th>
                  <th>Status</th>
                  <th>Last Activity</th>
                  <th>Resets</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const badge = statusBadge(row.status)
                  return (
                    <tr key={`${row.identifier}-${idx}`}>
                      <td className="admin-cell-strong">{row.identifier}</td>
                      <td>
                        {row.requests}
                      </td>
                      <td>{row.limit}</td>
                      <td>
                        <span className={badge.className}>{badge.label}</span>
                      </td>
                      <td className="admin-table-muted">{formatDate(row.lastActivityAt)}</td>
                      <td className="admin-table-muted">{formatDate(row.resetAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {summary.currentlyLimited === 0 && rows.length > 0 ? (
          <div className="admin-inline-note">No users are currently rate limited.</div>
        ) : null}
      </div>
    </main>
  )
}
