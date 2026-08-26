'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminConfirmModal from '@/components/admin/AdminConfirmModal'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import type {
  LeadDateFilter,
  LeadSortPreset,
  LeadTypeFilter,
} from '@/lib/admin/leadFilters'
import {
  parseLeadDateFilter,
  parseLeadLimit,
  parseLeadSortPreset,
  parseLeadTypeFilter,
} from '@/lib/admin/leadFilters'

interface Lead {
  id: string
  email: string
  name: string | null
  company: string | null
  website_url: string
  requested_report_type: string
  created_at: string
}

interface EditForm {
  email: string
  name: string
  company: string
  websiteUrl: string
  requestedReportType: string
}

interface Summary {
  total: number
  detailedCount: number
  recentCount: number
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

function requestBadge(type: string) {
  const value = String(type || '').toLowerCase()
  if (value === 'detailed') return { label: 'Detailed', className: 'admin-badge admin-badge-info' }
  if (value === 'snapshot') return { label: 'Snapshot', className: 'admin-badge admin-badge-muted' }
  if (value === 'pdf') return { label: 'PDF', className: 'admin-badge admin-badge-success' }
  return { label: type || '—', className: 'admin-badge admin-badge-muted' }
}

function LeadsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [rows, setRows] = useState<Lead[]>([])
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1))
  const [limit, setLimit] = useState(() => parseLeadLimit(searchParams.get('limit')))
  const [totalPages, setTotalPages] = useState(1)
  const [totalRows, setTotalRows] = useState(0)
  const [query, setQuery] = useState(() => searchParams.get('q') || '')
  const [type, setType] = useState<LeadTypeFilter>(() =>
    parseLeadTypeFilter(searchParams.get('type'))
  )
  const [date, setDate] = useState<LeadDateFilter>(() =>
    parseLeadDateFilter(searchParams.get('date'))
  )
  const [sort, setSort] = useState<LeadSortPreset>(() =>
    parseLeadSortPreset(searchParams.get('sort'))
  )
  const [summary, setSummary] = useState<Summary>({ total: 0, detailedCount: 0, recentCount: 0 })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successNote, setSuccessNote] = useState<string | null>(null)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [form, setForm] = useState<EditForm | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[] | null>(null)

  const syncUrl = useCallback(
    (next: {
      page: number
      limit: number
      q: string
      type: LeadTypeFilter
      date: LeadDateFilter
      sort: LeadSortPreset
    }) => {
      const params = new URLSearchParams()
      if (next.page > 1) params.set('page', String(next.page))
      if (next.limit !== 20) params.set('limit', String(next.limit))
      if (next.q.trim()) params.set('q', next.q.trim())
      if (next.type !== 'all') params.set('type', next.type)
      if (next.date !== 'all') params.set('date', next.date)
      if (next.sort !== 'newest') params.set('sort', next.sort)
      const qs = params.toString()
      router.replace(qs ? `/admin/dashboard/leads?${qs}` : '/admin/dashboard/leads')
    },
    [router]
  )

  const loadLeads = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        q: query,
        type,
        date,
        sort,
      })
      const res = await fetch(`/api/admin/leads?${params.toString()}`, { cache: 'no-store' })
      if (res.status === 401) {
        router.push('/admin')
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load leads')
      setRows(data.rows || [])
      setTotalRows(Number(data.total || 0))
      setTotalPages(Math.max(1, Number(data.totalPages || 1)))
      if (data.summary) setSummary(data.summary)
      setSelected(new Set())
      setMenuOpenId(null)
    } catch (err: any) {
      setError(err?.message || 'Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [date, limit, page, query, router, sort, type])

  useEffect(() => {
    syncUrl({ page, limit, q: query, type, date, sort })
  }, [date, limit, page, query, sort, syncUrl, type])

  useEffect(() => {
    const timer = setTimeout(loadLeads, 200)
    return () => clearTimeout(timer)
  }, [loadLeads])

  useEffect(() => {
    if (!successNote) return
    const t = setTimeout(() => setSuccessNote(null), 3200)
    return () => clearTimeout(t)
  }, [successNote])

  const allVisibleSelected = useMemo(
    () => rows.length > 0 && rows.every((row) => selected.has(row.id)),
    [rows, selected]
  )

  const filtersActive =
    query.trim() !== '' || type !== 'all' || date !== 'all' || sort !== 'newest' || limit !== 20

  function clearFilters() {
    setQuery('')
    setType('all')
    setDate('all')
    setSort('newest')
    setLimit(20)
    setPage(1)
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleVisible() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) rows.forEach((row) => next.delete(row.id))
      else rows.forEach((row) => next.add(row.id))
      return next
    })
  }

  async function performDelete(ids: string[]) {
    if (!ids.length) return
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
      const deleted = Number(data.deleted || ids.length)
      setSuccessNote(
        deleted === 1 ? '1 lead deleted.' : `${deleted} leads deleted.`
      )
      setConfirmDeleteIds(null)
      if (rows.length === ids.length && page > 1) setPage((p) => Math.max(1, p - 1))
      else await loadLeads()
    } catch (err: any) {
      setError(err?.message || 'Failed to delete leads')
    } finally {
      setActionLoading(false)
    }
  }

  function openEdit(lead: Lead) {
    setMenuOpenId(null)
    setEditing(lead)
    setForm({
      email: lead.email || '',
      name: lead.name || '',
      company: lead.company || '',
      websiteUrl: lead.website_url || '',
      requestedReportType: lead.requested_report_type || 'detailed',
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
      setSuccessNote('Lead updated.')
      await loadLeads()
    } catch (err: any) {
      setError(err?.message || 'Failed to save lead')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <main className="admin-page">
      <AdminPageHeader
        eyebrow="ADMIN · LEADS"
        title="Leads"
        subtitle="Incoming businesses requesting detailed analysis."
      />

      <div className="admin-summary-grid admin-summary-grid-3">
        {[
          { label: 'Total Leads', value: summary.total },
          { label: 'Detailed Requests', value: summary.detailedCount },
          { label: 'Recent (7d)', value: summary.recentCount },
        ].map((card) => (
          <div key={card.label} className="admin-summary-card admin-summary-card-static">
            <span className="admin-summary-label">{card.label}</span>
            <span className="admin-summary-value">{card.value}</span>
          </div>
        ))}
      </div>

      <div className="admin-panel admin-filters">
        <div className="admin-filter-row">
          <input
            className="admin-input admin-input-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Search email, name, company or website…"
          />
        </div>
        <div className="admin-filter-row admin-filter-row-wrap">
          <label className="admin-field">
            <span>Report Type</span>
            <select
              className="admin-input"
              value={type}
              onChange={(e) => {
                setType(parseLeadTypeFilter(e.target.value))
                setPage(1)
              }}
            >
              <option value="all">All</option>
              <option value="detailed">Detailed</option>
              <option value="snapshot">Snapshot</option>
              <option value="pdf">PDF</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Date</span>
            <select
              className="admin-input"
              value={date}
              onChange={(e) => {
                setDate(parseLeadDateFilter(e.target.value))
                setPage(1)
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Sort</span>
            <select
              className="admin-input"
              value={sort}
              onChange={(e) => {
                setSort(parseLeadSortPreset(e.target.value))
                setPage(1)
              }}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="company_asc">Company A–Z</option>
              <option value="company_desc">Company Z–A</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Rows</span>
            <select
              className="admin-input"
              value={String(limit)}
              onChange={(e) => {
                setLimit(parseLeadLimit(e.target.value))
                setPage(1)
              }}
            >
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>
          {filtersActive ? (
            <button type="button" className="admin-btn admin-btn-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          ) : null}
        </div>

        {selected.size > 0 ? (
          <div className="admin-bulk-bar">
            <span>{selected.size} selected</span>
            <button
              type="button"
              className="admin-btn admin-btn-danger"
              disabled={actionLoading}
              onClick={() => setConfirmDeleteIds(Array.from(selected))}
            >
              Delete Selected
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              onClick={() => setSelected(new Set())}
            >
              Clear Selection
            </button>
          </div>
        ) : null}
      </div>

      {error ? <div className="admin-alert admin-alert-danger">{error}</div> : null}
      {successNote ? <div className="admin-alert admin-alert-success">{successNote}</div> : null}

      <div className="admin-panel">
        <div className="admin-table-meta">
          {totalRows} matching records · Page {page} of {totalPages}
        </div>

        {loading ? (
          <div className="admin-loading">
            <div className="loader" />
          </div>
        ) : rows.length === 0 ? (
          <AdminEmptyState
            title={filtersActive ? 'No leads match your filters.' : 'No leads yet.'}
            body={
              filtersActive
                ? 'Try clearing filters or refining your search.'
                : 'New detailed-report requests will appear here.'
            }
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 42 }}>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleVisible}
                      aria-label="Select current page"
                    />
                  </th>
                  <th>Date</th>
                  <th>Contact</th>
                  <th>Company</th>
                  <th>Website</th>
                  <th>Request</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const badge = requestBadge(row.requested_report_type)
                  return (
                    <tr key={row.id} className={selected.has(row.id) ? 'is-selected' : undefined}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(row.id)}
                          onChange={() => toggleRow(row.id)}
                          aria-label={`Select ${row.email}`}
                        />
                      </td>
                      <td className="admin-table-muted">{formatDate(row.created_at)}</td>
                      <td>
                        <div className="admin-cell-strong">{row.name || '—'}</div>
                        <div className="admin-cell-muted">{row.email}</div>
                      </td>
                      <td>{row.company || '—'}</td>
                      <td>
                        <a
                          href={row.website_url}
                          target="_blank"
                          rel="noreferrer"
                          className="admin-table-link"
                        >
                          {hostFromUrl(row.website_url)}
                        </a>
                      </td>
                      <td>
                        <span className={badge.className}>{badge.label}</span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary admin-btn-compact"
                            disabled={actionLoading}
                            onClick={() => openEdit(row)}
                          >
                            Edit
                          </button>
                          <div className="admin-more">
                            <button
                              type="button"
                              className="admin-btn admin-btn-ghost admin-btn-compact"
                              onClick={() =>
                                setMenuOpenId((id) => (id === row.id ? null : row.id))
                              }
                            >
                              More ▾
                            </button>
                            {menuOpenId === row.id ? (
                              <div className="admin-more-menu">
                                <a
                                  href={row.website_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="admin-more-item"
                                  onClick={() => setMenuOpenId(null)}
                                >
                                  Open Website
                                </a>
                                <button
                                  type="button"
                                  className="admin-more-item admin-more-item-danger"
                                  onClick={() => {
                                    setMenuOpenId(null)
                                    setConfirmDeleteIds([row.id])
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="admin-pagination">
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>

      {editing && form ? (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal admin-modal-wide">
            <div className="admin-modal-header">
              <div>
                <div className="admin-modal-title">Edit Lead</div>
                <div className="admin-modal-subtitle">{editing.email}</div>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => {
                  setEditing(null)
                  setForm(null)
                }}
              >
                ×
              </button>
            </div>
            <div className="admin-modal-form">
              <label className="admin-field">
                <span>Name</span>
                <input
                  className="admin-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Company</span>
                <input
                  className="admin-input"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Email *</span>
                <input
                  className="admin-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Requested Report Type *</span>
                <select
                  className="admin-input"
                  value={form.requestedReportType}
                  onChange={(e) =>
                    setForm({ ...form, requestedReportType: e.target.value })
                  }
                >
                  <option value="detailed">detailed</option>
                  <option value="snapshot">snapshot</option>
                  <option value="pdf">pdf</option>
                </select>
              </label>
              <label className="admin-field admin-field-full">
                <span>Website *</span>
                <input
                  className="admin-input"
                  value={form.websiteUrl}
                  onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                />
              </label>
            </div>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={actionLoading}
                onClick={() => {
                  setEditing(null)
                  setForm(null)
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                disabled={actionLoading}
                onClick={saveEdit}
              >
                {actionLoading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AdminConfirmModal
        open={Boolean(confirmDeleteIds?.length)}
        title={
          confirmDeleteIds?.length === 1
            ? 'Delete this lead?'
            : `Delete ${confirmDeleteIds?.length || 0} leads?`
        }
        body="This permanently removes the selected lead records. Generated reports are separate and are not deleted."
        confirmLabel="Delete"
        danger
        busy={actionLoading}
        onCancel={() => setConfirmDeleteIds(null)}
        onConfirm={() => performDelete(confirmDeleteIds || [])}
      />
    </main>
  )
}

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="admin-loading">
          <div className="loader" />
        </div>
      }
    >
      <LeadsPageInner />
    </Suspense>
  )
}
