'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminEmptyState from '@/components/admin/AdminEmptyState'

type RatingRow = {
  id: string
  website_url: string
  email: string | null
  rating: number
  comment: string | null
  created_at: string
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

function hostFromUrl(url: string) {
  return String(url || '')
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '')
}

export default function RatingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<RatingRow[]>([])
  const [avgRating, setAvgRating] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/admin/ratings?limit=50', { cache: 'no-store' })
        if (res.status === 401) {
          router.push('/admin')
          return
        }
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load ratings')
        setRows(data.rows || [])
        setTotal(Number(data.summary?.total || 0))
        setAvgRating(Number(data.summary?.avgRating || 0))
      } catch (err: any) {
        setError(err?.message || 'Failed to load ratings')
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  return (
    <main className="admin-page">
      <AdminPageHeader
        eyebrow="ADMIN · TOOLS"
        title="Ratings & Feedback"
        subtitle="Real submitted ratings from the public report experience."
      />

      <div className="admin-summary-grid admin-summary-grid-2">
        <div className="admin-summary-card admin-summary-card-static">
          <span className="admin-summary-label">Average Rating</span>
          <span className="admin-summary-value">
            {total > 0 && avgRating ? `${avgRating}★` : 'N/A'}
          </span>
        </div>
        <div className="admin-summary-card admin-summary-card-static">
          <span className="admin-summary-label">Total Ratings</span>
          <span className="admin-summary-value">{total}</span>
        </div>
      </div>

      {error ? <div className="admin-alert admin-alert-danger">{error}</div> : null}

      <div className="admin-panel">
        {loading ? (
          <div className="admin-loading">
            <div className="loader" />
          </div>
        ) : rows.length === 0 ? (
          <AdminEmptyState
            title="No ratings have been submitted yet."
            body="When visitors rate a generated report, their score and optional comment will appear here."
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Website</th>
                  <th>Rating</th>
                  <th>Comment</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="admin-table-muted">{formatDate(row.created_at)}</td>
                    <td>{hostFromUrl(row.website_url)}</td>
                    <td>
                      <span style={{ color: '#b45309', fontWeight: 700 }}>
                        {'★'.repeat(Number(row.rating || 0))}
                      </span>
                    </td>
                    <td>{row.comment || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
