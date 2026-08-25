'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type LeadStatus = 'all' | 'genuine' | 'test'
type SortDirection = 'asc' | 'desc'

interface Lead {
  id: string
  email: string
  name: string | null
  company: string | null
  website_url: string
  requested_report_type: string
  is_test: boolean
  created_at: string
}

interface LeadSummary {
  total: number
  genuine: number
  test: number
}

interface EditForm {
  email: string
  name: string
  company: string
  websiteUrl: string
  requestedReportType: string
  isTest: boolean
}

const EMPTY_SUMMARY: LeadSummary = { total: 0, genuine: 0, test: 0 }

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

export default function LeadManagerPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Lead[]>([])
  const [summary, setSummary] = useState<LeadSummary>(EMPTY_SUMMARY)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRows, setTotalRows] = useState(0)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<LeadStatus>('all')
  const [sort, setSort] = useState('created_at')
  const [direction, setDirection] = useState<SortDirection>('desc')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [form, setForm] = useState<EditForm | null>(null)

  const loadLeads = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        q: query,
        status,
        sort,
        dir: direction,
      })

      const res = await fetch(`/api/admin/leads?${params.toString()}`, { cache: 'no-store' })
      if (res.status === 401) {
        router.push('/admin')
        return
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load leads')

      setRows(data.rows || [])
      setSummary(data.summary || EMPTY_SUMMARY)
      setTotalRows(Number(data.total || 0))
      setTotalPages(Math.max(1, Number(data.totalPages || 1)))
      setSelected(new Set())
    } catch (err: any) {
      setError(err?.message || 'Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [direction, page, query, router, sort, status])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLeads()
    }, 250)
    return () => clearTimeout(timer)
  }, [loadLeads])

  const allVisibleSelected = useMemo(
    () => rows.length > 0 && rows.every(row => selected.has(row.id)),
    [rows, selected]
  )

  function toggleRow(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleVisible() {
    setSelected(prev => {
      const next = new Set(prev)
      if (allVisibleSelected) rows.forEach(row => next.delete(row.id))
      else rows.forEach(row => next.add(row.id))
      return next
    })
  }

  async function setLeadClassification(ids: string[], isTest: boolean) {
    if (!ids.length) return
    setActionLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isTest ? 'set_test' : 'set_genuine',
          ids,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update leads')
      await loadLeads()
    } catch (err: any) {
      setError(err?.message || 'Failed to update leads')
    } finally {
      setActionLoading(false)
    }
  }

  async function deleteLeads(ids: string[]) {
    if (!ids.length) return
    const label = ids.length === 1 ? 'this lead' : `${ids.length} leads`
    if (!window.confirm(`Permanently delete ${label}? This cannot be undone.`)) return

    setActionLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete leads')

      if (rows.length === ids.length && page > 1) {
        setPage(p => Math.max(1, p - 1))
      } else {
        await loadLeads()
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to delete leads')
    } finally {
      setActionLoading(false)
    }
  }

  function openEdit(lead: Lead) {
    setEditing(lead)
    setForm({
      email: lead.email || '',
      name: lead.name || '',
      company: lead.company || '',
      websiteUrl: lead.website_url || '',
      requestedReportType: lead.requested_report_type || '',
      isTest: Boolean(lead.is_test),
    })
  }

  async function saveEdit() {
    if (!editing || !form) return
    if (!form.email.trim() || !form.websiteUrl.trim() || !form.requestedReportType.trim()) {
      setError('Email, website and report type are required.')
      return
    }

    setActionLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', id: editing.id, updates: form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save lead')
      setEditing(null)
      setForm(null)
      await loadLeads()
    } catch (err: any) {
      setError(err?.message || 'Failed to save lead')
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
          <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: '#34d399', marginBottom: '7px' }}>
            ADMIN · LEADS
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--t-100)', margin: 0 }}>
            Lead Manager
          </h1>
          <div style={{ color: 'var(--t-400)', fontSize: '13px', marginTop: '7px' }}>
            Classify test records, edit lead details, sort the database and permanently remove unwanted entries.
          </div>
        </div>
        <Link href="/admin/dashboard" className="btn btn-secondary" style={{ textDecoration: 'none', fontSize: '12px' }}>
          ← Dashboard
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Genuine Leads', value: summary.genuine, color: '#10b981' },
          { label: 'Test Leads', value: summary.test, color: '#f59e0b' },
          { label: 'All Records', value: summary.total, color: '#6366f1' },
        ].map(card => (
          <div key={card.label} className="glass" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t-400)', marginBottom: '7px' }}>
              {card.label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '27px', fontWeight: 800, color: card.color }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="glass" style={{ padding: '18px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1) }}
            placeholder="Search email, name, company or website..."
            style={{ ...controlStyle, flex: '1 1 280px', minWidth: '220px' }}
          />
          <select
            value={status}
            onChange={e => { setStatus(e.target.value as LeadStatus); setPage(1) }}
            style={controlStyle}
          >
            <option value="all">All records</option>
            <option value="genuine">Genuine only</option>
            <option value="test">Test only</option>
          </select>
          <select value={sort} onChange={e => { setSort(e.target.value); setPage(1) }} style={controlStyle}>
            <option value="created_at">Sort: Date</option>
            <option value="company">Sort: Company</option>
            <option value="name">Sort: Name</option>
            <option value="email">Sort: Email</option>
            <option value="website_url">Sort: Website</option>
            <option value="requested_report_type">Sort: Report Type</option>
            <option value="is_test">Sort: Test Status</option>
          </select>
          <button
            onClick={() => setDirection(d => d === 'asc' ? 'desc' : 'asc')}
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '9px 13px' }}
          >
            {direction === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>

        {selected.size > 0 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '12px', color: 'var(--t-300)', marginRight: '4px' }}>{selected.size} selected</span>
            <button disabled={actionLoading} className="btn btn-secondary" onClick={() => setLeadClassification(Array.from(selected), false)} style={{ fontSize: '11px', padding: '7px 12px' }}>
              Mark Genuine
            </button>
            <button disabled={actionLoading} className="btn btn-secondary" onClick={() => setLeadClassification(Array.from(selected), true)} style={{ fontSize: '11px', padding: '7px 12px' }}>
              Mark Test
            </button>
            <button
              disabled={actionLoading}
              onClick={() => deleteLeads(Array.from(selected))}
              style={{ padding: '7px 12px', borderRadius: '7px', border: '1px solid rgba(248,113,113,0.35)', background: 'rgba(248,113,113,0.08)', color: '#f87171', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '11px 14px', marginBottom: '16px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)', color: '#f87171', fontSize: '12px', fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div className="glass" style={{ padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ color: 'var(--t-400)', fontSize: '12px' }}>
            {totalRows} matching records · Page {page} of {totalPages}
          </div>
          {actionLoading && <div style={{ color: '#34d399', fontSize: '11px', fontWeight: 700 }}>Saving changes...</div>}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '54px' }}>
            <div className="loader" style={{ margin: '0 auto' }} />
          </div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '54px', color: 'var(--t-400)', fontSize: '13px' }}>
            No leads match these filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '42px' }}>
                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} aria-label="Select visible leads" />
                  </th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Company</th>
                  <th style={thStyle}>Website</th>
                  <th style={thStyle}>Report</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id} style={{ background: selected.has(row.id) ? 'rgba(16,185,129,0.05)' : 'transparent' }}>
                    <td style={tdStyle}>
                      <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} aria-label={`Select ${row.email}`} />
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 650, color: 'var(--t-100)' }}>{row.name || '—'}</td>
                    <td style={tdStyle}>{row.email}</td>
                    <td style={tdStyle}>{row.company || '—'}</td>
                    <td style={{ ...tdStyle, maxWidth: '230px' }}>
                      <a href={row.website_url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>
                        {row.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    </td>
                    <td style={tdStyle}>{row.requested_report_type}</td>
                    <td style={tdStyle}>
                      <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: '100px', fontSize: '10px', fontWeight: 800, color: row.is_test ? '#f59e0b' : '#34d399', background: row.is_test ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', border: row.is_test ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(16,185,129,0.25)' }}>
                        {row.is_test ? 'TEST' : 'GENUINE'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: 'var(--t-400)' }}>{formatDate(row.created_at)}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '6px', whiteSpace: 'nowrap' }}>
                        <button className="btn btn-secondary" disabled={actionLoading} onClick={() => openEdit(row)} style={{ fontSize: '10px', padding: '5px 9px' }}>Edit</button>
                        <button className="btn btn-secondary" disabled={actionLoading} onClick={() => setLeadClassification([row.id], !row.is_test)} style={{ fontSize: '10px', padding: '5px 9px' }}>
                          {row.is_test ? 'Genuine' : 'Test'}
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => deleteLeads([row.id])}
                          style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.28)', background: 'transparent', color: '#f87171', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Delete
                        </button>
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

      {editing && form && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 260, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '620px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: '#0f1117', boxShadow: '0 24px 70px rgba(0,0,0,0.45)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--t-100)', fontSize: '16px' }}>Edit Lead</div>
                <div style={{ fontSize: '11px', color: 'var(--t-400)', marginTop: '3px' }}>{editing.email}</div>
              </div>
              <button onClick={() => { setEditing(null); setForm(null) }} style={{ background: 'none', border: 'none', color: 'var(--t-400)', fontSize: '22px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ padding: '22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: 'var(--t-300)' }}>
                Name
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={controlStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: 'var(--t-300)' }}>
                Company
                <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} style={controlStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: 'var(--t-300)' }}>
                Email *
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={controlStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: 'var(--t-300)' }}>
                Report Type *
                <input value={form.requestedReportType} onChange={e => setForm({ ...form, requestedReportType: e.target.value })} style={controlStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: 'var(--t-300)', gridColumn: '1 / -1' }}>
                Website *
                <input value={form.websiteUrl} onChange={e => setForm({ ...form, websiteUrl: e.target.value })} style={controlStyle} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--t-200)', gridColumn: '1 / -1', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isTest} onChange={e => setForm({ ...form, isTest: e.target.checked })} />
                Mark this record as test data
              </label>
            </div>

            <div style={{ padding: '16px 22px 20px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--glass-border)' }}>
              <button className="btn btn-secondary" disabled={actionLoading} onClick={() => { setEditing(null); setForm(null) }} style={{ fontSize: '12px' }}>Cancel</button>
              <button className="btn btn-primary" disabled={actionLoading} onClick={saveEdit} style={{ fontSize: '12px' }}>
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
