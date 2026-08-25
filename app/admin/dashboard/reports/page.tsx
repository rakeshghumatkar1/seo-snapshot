'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { detectReportVersion } from '@/types/report'
import {
  getSectionLabel,
  iterableSectionEntries,
} from '@/lib/report/sectionLabels'

type ReportType = 'all' | 'snapshot' | 'detailed'
type SortDirection = 'asc' | 'desc'

interface ReportRow {
  id: string
  website_url: string
  report_type: string
  email: string | null
  status: string | null
  sections_json: Record<string, unknown> | null
  created_at: string
  pdf_filename: string | null
  pdf_generated_at: string | null
  has_pdf: boolean
}

interface Summary {
  total: number
  snapshot: number
  detailed: number
  pdfCount: number
}

const EMPTY_SUMMARY: Summary = { total: 0, snapshot: 0, detailed: 0, pdfCount: 0 }

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

export default function ReportsLibraryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [rows, setRows] = useState<ReportRow[]>([])
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRows, setTotalRows] = useState(0)
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [type, setType] = useState<ReportType>('all')
  const [sort, setSort] = useState('created_at')
  const [direction, setDirection] = useState<SortDirection>('desc')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<ReportRow | null>(null)

  const loadReports = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        q: query,
        type,
        sort,
        dir: direction,
      })
      const res = await fetch(`/api/admin/reports?${params.toString()}`, { cache: 'no-store' })
      if (res.status === 401) {
        router.push('/admin')
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load reports')

      setRows(data.rows || [])
      setSummary(data.summary || EMPTY_SUMMARY)
      setTotalRows(Number(data.total || 0))
      setTotalPages(Math.max(1, Number(data.totalPages || 1)))
    } catch (err: any) {
      setError(err?.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [direction, page, query, router, sort, type])

  useEffect(() => {
    const timer = setTimeout(loadReports, 250)
    return () => clearTimeout(timer)
  }, [loadReports])

  async function deleteReport(report: ReportRow) {
    if (!window.confirm(`Delete the saved ${report.report_type} report for ${report.website_url}? This cannot be undone.`)) return
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [report.id] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete report')
      await loadReports()
    } catch (err: any) {
      setError(err?.message || 'Failed to delete report')
    } finally {
      setActionLoading(false)
    }
  }

  const controlStyle: React.CSSProperties = {
    padding: '9px 11px',
    borderRadius: '8px',
    border: '1px solid var(--glass-border)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--t-100)',
    fontSize: '12px',
    outline: 'none',
  }

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '10px 12px',
    borderBottom: '1px solid var(--glass-border)',
    color: 'var(--t-300)',
    fontWeight: 700,
    fontSize: '10px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  }

  const tdStyle: React.CSSProperties = {
    padding: '11px 12px',
    color: 'var(--t-200)',
    fontSize: '12px',
    verticalAlign: 'middle',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  }

  return (
    <main style={{ minHeight: '100vh', padding: '58px 28px 40px', maxWidth: '1500px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: '#34d399', marginBottom: '7px' }}>ADMIN · REPORTS</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--t-100)', margin: 0 }}>Reports Library</h1>
          <div style={{ color: 'var(--t-400)', fontSize: '13px', marginTop: '7px' }}>
            Review every saved Snapshot and Detailed report, open the report content, and view or download its PDF.
          </div>
        </div>
        <Link href="/admin/dashboard" className="btn btn-secondary" style={{ textDecoration: 'none', fontSize: '12px' }}>← Dashboard</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'All Reports', value: summary.total, color: '#6366f1' },
          { label: 'Snapshot', value: summary.snapshot, color: '#10b981' },
          { label: 'Detailed', value: summary.detailed, color: '#f59e0b' },
          { label: 'PDFs Stored', value: summary.pdfCount, color: '#3b82f6' },
        ].map(card => (
          <div key={card.label} className="glass" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t-400)', marginBottom: '7px' }}>{card.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '27px', fontWeight: 800, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div className="glass" style={{ padding: '18px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1) }}
            placeholder="Search website, email, status or report type..."
            style={{ ...controlStyle, flex: '1 1 280px', minWidth: '220px' }}
          />
          <select value={type} onChange={e => { setType(e.target.value as ReportType); setPage(1) }} style={controlStyle}>
            <option value="all">All report types</option>
            <option value="snapshot">Snapshot only</option>
            <option value="detailed">Detailed only</option>
          </select>
          <select value={sort} onChange={e => { setSort(e.target.value); setPage(1) }} style={controlStyle}>
            <option value="created_at">Sort: Date</option>
            <option value="website_url">Sort: Website</option>
            <option value="report_type">Sort: Report Type</option>
            <option value="email">Sort: Email</option>
            <option value="status">Sort: Status</option>
          </select>
          <button onClick={() => setDirection(d => d === 'asc' ? 'desc' : 'asc')} className="btn btn-secondary" style={{ fontSize: '12px', padding: '9px 13px' }}>
            {direction === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '11px 14px', marginBottom: '16px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)', color: '#f87171', fontSize: '12px', fontWeight: 600 }}>{error}</div>
      )}

      <div className="glass" style={{ padding: '18px' }}>
        <div style={{ color: 'var(--t-400)', fontSize: '12px', marginBottom: '12px' }}>{totalRows} matching reports · Page {page} of {totalPages}</div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '54px' }}><div className="loader" style={{ margin: '0 auto' }} /></div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '54px', color: 'var(--t-400)', fontSize: '13px' }}>No reports match these filters.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '980px' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Website</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>PDF</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id}>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: 'var(--t-400)' }}>{formatDate(row.created_at)}</td>
                    <td style={{ ...tdStyle, maxWidth: '260px' }}>
                      <a href={row.website_url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>
                        {row.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: '100px', fontSize: '10px', fontWeight: 800, color: row.report_type === 'detailed' ? '#f59e0b' : '#34d399', background: row.report_type === 'detailed' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)' }}>{row.report_type.toUpperCase()}</span>
                    </td>
                    <td style={tdStyle}>{row.email || '—'}</td>
                    <td style={tdStyle}>{row.status || '—'}</td>
                    <td style={tdStyle}>
                      <span style={{ color: row.has_pdf ? '#34d399' : '#f59e0b', fontSize: '11px', fontWeight: 700 }}>{row.has_pdf ? 'Stored' : 'Create on open'}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '6px', whiteSpace: 'nowrap' }}>
                        <button className="btn btn-secondary" onClick={() => setViewing(row)} style={{ fontSize: '10px', padding: '5px 9px' }}>View Report</button>
                        <a href={`/api/admin/reports/${row.id}/pdf`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ fontSize: '10px', padding: '5px 9px', textDecoration: 'none' }}>View PDF</a>
                        <a href={`/api/admin/reports/${row.id}/pdf?download=1`} className="btn btn-secondary" style={{ fontSize: '10px', padding: '5px 9px', textDecoration: 'none' }}>Download</a>
                        <button disabled={actionLoading} onClick={() => deleteReport(row)} style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.28)', background: 'transparent', color: '#f87171', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
            <button className="btn btn-ghost" disabled={page === 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))} style={{ fontSize: '12px' }}>← Prev</button>
            <span style={{ color: 'var(--t-400)', fontSize: '12px' }}>{page} / {totalPages}</span>
            <button className="btn btn-ghost" disabled={page >= totalPages || loading} onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{ fontSize: '12px' }}>Next →</button>
          </div>
        )}
      </div>

      {viewing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 270, background: 'rgba(0,0,0,0.76)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '900px', maxHeight: '88vh', borderRadius: '12px', border: '1px solid var(--glass-border)', background: '#0f1117', boxShadow: '0 24px 70px rgba(0,0,0,0.45)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--t-100)', fontSize: '16px' }}>{viewing.website_url}</div>
                <div style={{ fontSize: '11px', color: 'var(--t-400)', marginTop: '3px' }}>{viewing.report_type.toUpperCase()} · {formatDate(viewing.created_at)}</div>
              </div>
              <button onClick={() => setViewing(null)} style={{ background: 'none', border: 'none', color: 'var(--t-400)', fontSize: '22px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ padding: '22px', overflowY: 'auto' }}>
              {iterableSectionEntries(viewing.sections_json || {}).map(([key, value]) => {
                const reportType = viewing.report_type === 'detailed' ? 'detailed' : 'snapshot'
                const version = detectReportVersion(viewing.sections_json || {})
                const label = getSectionLabel(key, reportType, version)
                return (
                  <div key={key} style={{ marginBottom: '18px', padding: '16px 18px', border: '1px solid var(--glass-border)', borderLeft: '3px solid #10b981', borderRadius: '8px', background: 'rgba(255,255,255,0.025)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--t-400)', marginBottom: '4px' }}>{label.category}</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--t-100)', marginBottom: '8px' }}>{label.title}</div>
                    <div style={{ whiteSpace: 'pre-wrap', color: 'var(--t-300)', fontSize: '12px', lineHeight: 1.7 }}>{value}</div>
                  </div>
                )
              })}
            </div>

            <div style={{ padding: '14px 22px 18px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--glass-border)' }}>
              <a href={`/api/admin/reports/${viewing.id}/pdf`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ textDecoration: 'none', fontSize: '12px' }}>View PDF</a>
              <a href={`/api/admin/reports/${viewing.id}/pdf?download=1`} className="btn btn-primary" style={{ textDecoration: 'none', fontSize: '12px' }}>Download PDF</a>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
