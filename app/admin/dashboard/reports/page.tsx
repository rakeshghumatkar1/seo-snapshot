'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { detectReportVersion } from '@/types/report'
import {
  getSectionLabel,
  iterableSectionEntries,
} from '@/lib/report/sectionLabels'
import AnonymizedSampleDrawer from '@/components/admin/AnonymizedSampleDrawer'
import ShareLinkModal from '@/components/admin/ShareLinkModal'
import type {
  DateFilter,
  PdfFilter,
  ReportTypeFilter,
  SampleFilter,
  SampleStatus,
  ShareFilter,
  SortPreset,
} from '@/lib/admin/reportFilters'
import {
  parseDateFilter,
  parseLimit,
  parsePdfFilter,
  parseReportTypeFilter,
  parseSampleFilter,
  parseShareFilter,
  parseSortPreset,
} from '@/lib/admin/reportFilters'

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
  sample_status?: SampleStatus | string | null
  share_status?: 'shared' | 'private' | string | null
  share_created_at?: string | null
}

interface Summary {
  total: number
  snapshot: number
  detailed: number
  pdfCount: number
  activeShareCount?: number
}

const EMPTY_SUMMARY: Summary = { total: 0, snapshot: 0, detailed: 0, pdfCount: 0, activeShareCount: 0 }

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

function formatDateParts(value: string): { date: string; time: string } {
  if (!value) return { date: '—', time: '' }
  const d = new Date(value)
  return {
    date: d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    time: d.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
  }
}

function hostFromUrl(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

/** Domain + optional path for compact table display (full URL remains the link href). */
function websiteDisplayParts(url: string): { host: string; path: string | null } {
  try {
    const parsed = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`)
    const host = parsed.hostname.replace(/^www\./i, '')
    const path = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname.replace(/\/$/, '') || null : null
    return { host: host || hostFromUrl(url), path }
  } catch {
    return { host: hostFromUrl(url), path: null }
  }
}

function sampleBadge(status: string | null | undefined) {
  const value = String(status || 'none')
  if (value === 'published') return { label: 'Published', className: 'admin-badge admin-badge-success' }
  if (value === 'needs_review') return { label: 'Needs Review', className: 'admin-badge admin-badge-warn' }
  if (value === 'failed') return { label: 'Failed', className: 'admin-badge admin-badge-danger' }
  if (value === 'draft') return { label: 'Draft', className: 'admin-badge admin-badge-info' }
  return { label: 'None', className: 'admin-badge admin-badge-muted' }
}

export default function ReportsLibraryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [rows, setRows] = useState<ReportRow[]>([])
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY)
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1))
  const [totalPages, setTotalPages] = useState(1)
  const [totalRows, setTotalRows] = useState(0)
  const [limit, setLimit] = useState(() => parseLimit(searchParams.get('limit')))
  const [query, setQuery] = useState(() => searchParams.get('q') || '')
  const [type, setType] = useState<ReportTypeFilter>(() => parseReportTypeFilter(searchParams.get('type')))
  const [pdf, setPdf] = useState<PdfFilter>(() => parsePdfFilter(searchParams.get('pdf')))
  const [sample, setSample] = useState<SampleFilter>(() => parseSampleFilter(searchParams.get('sample')))
  const [share, setShare] = useState<ShareFilter>(() => parseShareFilter(searchParams.get('share')))
  const [date, setDate] = useState<DateFilter>(() => parseDateFilter(searchParams.get('date')))
  const [sort, setSort] = useState<SortPreset>(() => parseSortPreset(searchParams.get('sort')))
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successNote, setSuccessNote] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [viewing, setViewing] = useState<ReportRow | null>(null)
  const [anonymizeReport, setAnonymizeReport] = useState<ReportRow | null>(null)
  const [shareReport, setShareReport] = useState<ReportRow | null>(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [confirmBulkRevokeShares, setConfirmBulkRevokeShares] = useState(false)
  const [confirmRevokeAllShares, setConfirmRevokeAllShares] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [openPdfId, setOpenPdfId] = useState<string | null>(null)
  const [activeShareCount, setActiveShareCount] = useState(0)
  const headerCheckboxRef = useRef<HTMLInputElement>(null)

  const filtersActive =
    Boolean(query.trim()) ||
    type !== 'all' ||
    pdf !== 'all' ||
    sample !== 'all' ||
    share !== 'all' ||
    date !== 'all' ||
    sort !== 'newest' ||
    limit !== 20

  const syncUrl = useCallback(
    (next: {
      page: number
      limit: number
      q: string
      type: ReportTypeFilter
      pdf: PdfFilter
      sample: SampleFilter
      share: ShareFilter
      date: DateFilter
      sort: SortPreset
    }) => {
      const params = new URLSearchParams()
      if (next.q.trim()) params.set('q', next.q.trim())
      if (next.type !== 'all') params.set('type', next.type)
      if (next.pdf !== 'all') params.set('pdf', next.pdf)
      if (next.sample !== 'all') params.set('sample', next.sample)
      if (next.share !== 'all') params.set('share', next.share)
      if (next.date !== 'all') params.set('date', next.date)
      if (next.sort !== 'newest') params.set('sort', next.sort)
      if (next.limit !== 20) params.set('limit', String(next.limit))
      if (next.page > 1) params.set('page', String(next.page))
      const qs = params.toString()
      router.replace(qs ? `/admin/dashboard/reports?${qs}` : '/admin/dashboard/reports')
    },
    [router]
  )

  const loadReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        q: query,
        type,
        pdf,
        sample,
        share,
        date,
        sort,
      })
      const res = await fetch(`/api/admin/reports?${params.toString()}`, { cache: 'no-store' })
      if (res.status === 401) {
        router.push('/admin')
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load reports')

      const nextTotalPages = Math.max(1, Number(data.totalPages || 1))
      if (page > nextTotalPages) {
        setPage(nextTotalPages)
        return
      }

      setRows(data.rows || [])
      setSummary(data.summary || EMPTY_SUMMARY)
      setActiveShareCount(Number(data.summary?.activeShareCount || 0))
      setTotalRows(Number(data.total || 0))
      setTotalPages(nextTotalPages)
      syncUrl({ page, limit, q: query, type, pdf, sample, share, date, sort })
    } catch (err: any) {
      setError(err?.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [date, limit, page, pdf, query, router, sample, share, sort, syncUrl, type])

  useEffect(() => {
    const timer = setTimeout(loadReports, 250)
    return () => clearTimeout(timer)
  }, [loadReports])

  useEffect(() => {
    setSelected(new Set())
    setOpenMenuId(null)
    setOpenPdfId(null)
  }, [page, type, pdf, sample, share, date, sort, limit, query])

  useEffect(() => {
    if (!successNote) return
    const timer = setTimeout(() => setSuccessNote(null), 3500)
    return () => clearTimeout(timer)
  }, [successNote])

  const allVisibleSelected = useMemo(
    () => rows.length > 0 && rows.every((row) => selected.has(row.id)),
    [rows, selected]
  )
  const someVisibleSelected = useMemo(
    () => rows.some((row) => selected.has(row.id)) && !allVisibleSelected,
    [rows, selected, allVisibleSelected]
  )

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someVisibleSelected
    }
  }, [someVisibleSelected])

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

  function clearFilters() {
    setQuery('')
    setType('all')
    setPdf('all')
    setSample('all')
    setShare('all')
    setDate('all')
    setSort('newest')
    setLimit(20)
    setPage(1)
    setSelected(new Set())
  }

  async function deleteIds(ids: string[]) {
    if (!ids.length || actionLoading) return
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete reports')
      const deleted = Number(data.deleted || ids.length)
      setSuccessNote(`${deleted} report${deleted === 1 ? '' : 's'} deleted.`)
      setSelected(new Set())
      setConfirmBulkDelete(false)
      setOpenMenuId(null)
      if (rows.length === ids.length && page > 1) {
        setPage((p) => Math.max(1, p - 1))
      } else {
        await loadReports()
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to delete reports')
    } finally {
      setActionLoading(false)
    }
  }

  async function deleteSingle(report: ReportRow) {
    if (
      !window.confirm(
        `Delete the saved ${report.report_type} report for ${hostFromUrl(report.website_url)}? This cannot be undone.`
      )
    ) {
      return
    }
    await deleteIds([report.id])
  }

  const selectedSharedCount = useMemo(
    () => rows.filter((r) => selected.has(r.id) && r.share_status === 'shared').length,
    [rows, selected]
  )

  async function revokeSelectedShares() {
    if (!selected.size || actionLoading) return
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/pdf-shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke_selected',
          reportIds: Array.from(selected),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to revoke share links')
      const revoked = Number(data.revoked || 0)
      setSuccessNote(
        revoked
          ? `${revoked} public PDF link${revoked === 1 ? '' : 's'} revoked.`
          : 'No active share links among the selection.'
      )
      setConfirmBulkRevokeShares(false)
      setSelected(new Set())
      setActiveShareCount(Number(data.activeShareCount || 0))
      await loadReports()
    } catch (err: any) {
      setError(err?.message || 'Failed to revoke share links')
    } finally {
      setActionLoading(false)
    }
  }

  async function revokeAllShares() {
    if (!activeShareCount || actionLoading) return
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/pdf-shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke_all' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to revoke all share links')
      const revoked = Number(data.revoked || 0)
      setSuccessNote(`${revoked} public PDF link${revoked === 1 ? '' : 's'} revoked.`)
      setConfirmRevokeAllShares(false)
      setActiveShareCount(0)
      await loadReports()
    } catch (err: any) {
      setError(err?.message || 'Failed to revoke all share links')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-page-header">
        <div>
          <div className="admin-eyebrow">ADMIN · REPORTS</div>
          <h1 className="admin-title">Reports Library</h1>
          <p className="admin-subtitle">
            Manage archived reports, open content or PDFs, and publish anonymised homepage samples.
          </p>
        </div>
        <Link href="/admin/dashboard" className="admin-btn admin-btn-secondary admin-btn-desktop-only">
          ← Dashboard
        </Link>
      </div>

      <div className="admin-summary-grid">
        {[
          {
            label: 'All Reports',
            value: summary.total,
            onClick: () => {
              setType('all')
              setPdf('all')
              setPage(1)
            },
          },
          {
            label: 'Snapshot',
            value: summary.snapshot,
            onClick: () => {
              setType('snapshot')
              setPage(1)
            },
          },
          {
            label: 'Detailed',
            value: summary.detailed,
            onClick: () => {
              setType('detailed')
              setPage(1)
            },
          },
          {
            label: 'PDFs Stored',
            value: summary.pdfCount,
            onClick: () => {
              setPdf('stored')
              setPage(1)
            },
          },
        ].map((card) => (
          <button key={card.label} type="button" className="admin-summary-card" onClick={card.onClick}>
            <span className="admin-summary-label">{card.label}</span>
            <span className="admin-summary-value">{card.value}</span>
          </button>
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
            placeholder="Search website or email…"
          />
        </div>
        <div className="admin-filter-row admin-filter-row-wrap">
          <label className="admin-field">
            <span>Report Type</span>
            <select
              className="admin-input"
              value={type}
              onChange={(e) => {
                setType(parseReportTypeFilter(e.target.value))
                setPage(1)
              }}
            >
              <option value="all">All</option>
              <option value="snapshot">Snapshot</option>
              <option value="detailed">Detailed</option>
            </select>
          </label>
          <label className="admin-field">
            <span>PDF</span>
            <select
              className="admin-input"
              value={pdf}
              onChange={(e) => {
                setPdf(parsePdfFilter(e.target.value))
                setPage(1)
              }}
            >
              <option value="all">All</option>
              <option value="stored">Stored</option>
              <option value="missing">Missing</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Sample Status</span>
            <select
              className="admin-input"
              value={sample}
              onChange={(e) => {
                setSample(parseSampleFilter(e.target.value))
                setPage(1)
              }}
            >
              <option value="all">All</option>
              <option value="published">Published Sample</option>
              <option value="needs_review">Needs Review</option>
              <option value="draft">Draft Sample</option>
              <option value="none">No Sample</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Share</span>
            <select
              className="admin-input"
              value={share}
              onChange={(e) => {
                setShare(parseShareFilter(e.target.value))
                setPage(1)
              }}
            >
              <option value="all">All</option>
              <option value="shared">Shared</option>
              <option value="private">Private</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Date</span>
            <select
              className="admin-input"
              value={date}
              onChange={(e) => {
                setDate(parseDateFilter(e.target.value))
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
                setSort(parseSortPreset(e.target.value))
                setPage(1)
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="website_asc">Website A–Z</option>
              <option value="website_desc">Website Z–A</option>
              <option value="type">Snapshot / Detailed</option>
              <option value="pdf">PDF Status</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Rows</span>
            <select
              className="admin-input"
              value={String(limit)}
              onChange={(e) => {
                setLimit(parseLimit(e.target.value))
                setPage(1)
              }}
            >
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>
          {filtersActive ? (
            <button type="button" className="admin-btn admin-btn-ghost" onClick={clearFilters}>
              Clear Filters
            </button>
          ) : null}
          {activeShareCount > 0 ? (
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              disabled={actionLoading}
              onClick={() => setConfirmRevokeAllShares(true)}
              title="Revoke every active public PDF link"
            >
              Revoke All Active Links ({activeShareCount})
            </button>
          ) : null}
        </div>
      </div>

      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}
      {successNote ? <div className="admin-alert admin-alert-success">{successNote}</div> : null}

      {selected.size > 0 ? (
        <div className="admin-bulk-bar">
          <span className="admin-bulk-count">{selected.size} selected</span>
          <div className="admin-bulk-actions">
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              disabled={actionLoading || selectedSharedCount === 0}
              onClick={() => setConfirmBulkRevokeShares(true)}
            >
              Revoke Share Links
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-danger"
              disabled={actionLoading}
              onClick={() => setConfirmBulkDelete(true)}
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
        </div>
      ) : null}

      <div className="admin-panel">
        <div className="admin-table-meta">
          {totalRows} matching reports · Page {page} of {totalPages}
        </div>

        {loading ? (
          <div className="admin-empty">
            <div className="loader" />
          </div>
        ) : rows.length === 0 ? (
          <div className="admin-empty">No reports match these filters.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-reports">
              <thead>
                <tr>
                  <th className="admin-th-check">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleVisible}
                      aria-label="Select all visible reports"
                    />
                  </th>
                  <th>Date</th>
                  <th>Website</th>
                  <th>Type</th>
                  <th>PDF</th>
                  <th>Sample</th>
                  <th>Share</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const sampleInfo = sampleBadge(row.sample_status)
                  const isSelected = selected.has(row.id)
                  const nonSuccess = row.status && row.status !== 'success'
                  const isShared = row.share_status === 'shared'
                  const dateParts = formatDateParts(row.created_at)
                  const site = websiteDisplayParts(row.website_url)
                  return (
                    <tr key={row.id} className={isSelected ? 'is-selected' : undefined}>
                      <td className="admin-td-check">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(row.id)}
                          aria-label={`Select ${site.host}`}
                        />
                      </td>
                      <td className="admin-td-date admin-td-nowrap">
                        <div className="admin-td-date-primary">{dateParts.date}</div>
                        {dateParts.time ? (
                          <div className="admin-td-date-time">{dateParts.time}</div>
                        ) : null}
                        {nonSuccess ? (
                          <span className="admin-badge admin-badge-warn" style={{ marginTop: 4 }}>
                            {row.status}
                          </span>
                        ) : null}
                      </td>
                      <td className="admin-td-website">
                        <a href={row.website_url} target="_blank" rel="noreferrer">
                          <span className="admin-td-website-host">{site.host}</span>
                          {site.path ? (
                            <span className="admin-td-website-path">{site.path}</span>
                          ) : null}
                        </a>
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${
                            row.report_type === 'detailed' ? 'admin-badge-warn' : 'admin-badge-success'
                          }`}
                        >
                          {row.report_type}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${
                            row.has_pdf ? 'admin-badge-success' : 'admin-badge-muted'
                          }`}
                        >
                          {row.has_pdf ? 'Stored' : 'Missing'}
                        </span>
                      </td>
                      <td>
                        <span className={sampleInfo.className}>{sampleInfo.label}</span>
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${
                            isShared ? 'admin-badge-info' : 'admin-badge-muted'
                          }`}
                        >
                          {isShared ? 'Shared' : 'Private'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            title="View report"
                            onClick={() => setViewing(row)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            title="Anonymised Sample"
                            onClick={() => setAnonymizeReport(row)}
                          >
                            Sample
                          </button>
                          <div className="admin-menu">
                            <button
                              type="button"
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                              title="PDF actions"
                              onClick={() => {
                                setOpenPdfId((id) => (id === row.id ? null : row.id))
                                setOpenMenuId(null)
                              }}
                            >
                              PDF ▾
                            </button>
                            {openPdfId === row.id ? (
                              <div className="admin-menu-panel">
                                <a
                                  href={`/api/admin/reports/${row.id}/pdf`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => setOpenPdfId(null)}
                                >
                                  View PDF
                                </a>
                                <a
                                  href={`/api/admin/reports/${row.id}/pdf?download=1`}
                                  onClick={() => setOpenPdfId(null)}
                                >
                                  Download PDF
                                </a>
                              </div>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            title="Public PDF share link"
                            onClick={() => {
                              setShareReport(row)
                              setOpenPdfId(null)
                              setOpenMenuId(null)
                            }}
                          >
                            Share
                          </button>
                          <div className="admin-menu">
                            <button
                              type="button"
                              className="admin-btn admin-btn-ghost admin-btn-sm"
                              title="More actions"
                              onClick={() => {
                                setOpenMenuId((id) => (id === row.id ? null : row.id))
                                setOpenPdfId(null)
                              }}
                            >
                              ⋯
                            </button>
                            {openMenuId === row.id ? (
                              <div className="admin-menu-panel">
                                <button
                                  type="button"
                                  className="admin-menu-danger"
                                  disabled={actionLoading}
                                  onClick={() => deleteSingle(row)}
                                >
                                  Delete Report
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
      </div>

      {viewing ? (
        <div className="admin-modal-backdrop" onClick={() => setViewing(null)}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <div className="admin-modal-title">{viewing.website_url}</div>
                <div className="admin-modal-meta">
                  {viewing.report_type.toUpperCase()} · {formatDate(viewing.created_at)}
                </div>
              </div>
              <button type="button" className="admin-modal-close" onClick={() => setViewing(null)}>
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              {iterableSectionEntries(viewing.sections_json || {}).map(([key, value]) => {
                const reportType = viewing.report_type === 'detailed' ? 'detailed' : 'snapshot'
                const version = detectReportVersion(viewing.sections_json || {})
                const label = getSectionLabel(key, reportType, version)
                return (
                  <div key={key} className="admin-section-card">
                    <div className="admin-section-category">{label.category}</div>
                    <div className="admin-section-title">{label.title}</div>
                    <div className="admin-section-body">{value}</div>
                  </div>
                )
              })}
            </div>
            <div className="admin-modal-footer">
              <a
                href={`/api/admin/reports/${viewing.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="admin-btn admin-btn-secondary"
              >
                View PDF
              </a>
              <a
                href={`/api/admin/reports/${viewing.id}/pdf?download=1`}
                className="admin-btn admin-btn-primary"
              >
                Download PDF
              </a>
            </div>
          </div>
        </div>
      ) : null}

      {confirmBulkDelete ? (
        <div className="admin-modal-backdrop" onClick={() => !actionLoading && setConfirmBulkDelete(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">Delete {selected.size} selected reports?</div>
              <button
                type="button"
                className="admin-modal-close"
                disabled={actionLoading}
                onClick={() => setConfirmBulkDelete(false)}
              >
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <p>
                This permanently removes the archived report and its linked showcase/sample data where
                ON DELETE CASCADE applies.
              </p>
              <p className="admin-danger-text">This cannot be undone.</p>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={actionLoading}
                onClick={() => setConfirmBulkDelete(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                disabled={actionLoading}
                onClick={() => deleteIds(Array.from(selected))}
              >
                {actionLoading ? 'Deleting…' : `Delete ${selected.size} Reports`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmBulkRevokeShares ? (
        <div
          className="admin-modal-backdrop"
          onClick={() => !actionLoading && setConfirmBulkRevokeShares(false)}
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">Revoke share links for selection?</div>
              <button
                type="button"
                className="admin-modal-close"
                disabled={actionLoading}
                onClick={() => setConfirmBulkRevokeShares(false)}
              >
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <p>
                Revoke public PDF links for the selected reports ({selectedSharedCount} currently
                shared among {selected.size} selected).
              </p>
              <p>Anyone using those links will immediately lose access. Reports and PDFs are not deleted.</p>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={actionLoading}
                onClick={() => setConfirmBulkRevokeShares(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                disabled={actionLoading}
                onClick={revokeSelectedShares}
              >
                {actionLoading ? 'Revoking…' : 'Revoke Share Links'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmRevokeAllShares ? (
        <div
          className="admin-modal-backdrop"
          onClick={() => !actionLoading && setConfirmRevokeAllShares(false)}
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">
                Revoke all {activeShareCount} active public PDF links?
              </div>
              <button
                type="button"
                className="admin-modal-close"
                disabled={actionLoading}
                onClick={() => setConfirmRevokeAllShares(false)}
              >
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <p>Anyone using any of these links will immediately lose access.</p>
              <p>Reports and stored PDFs will NOT be deleted.</p>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={actionLoading}
                onClick={() => setConfirmRevokeAllShares(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                disabled={actionLoading}
                onClick={revokeAllShares}
              >
                {actionLoading ? 'Revoking…' : `Revoke All ${activeShareCount} Links`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {shareReport ? (
        <ShareLinkModal
          reportId={shareReport.id}
          hostLabel={hostFromUrl(shareReport.website_url)}
          hasPdf={Boolean(shareReport.has_pdf)}
          initiallyShared={shareReport.share_status === 'shared'}
          onClose={() => setShareReport(null)}
          onChanged={() => {
            void loadReports()
          }}
        />
      ) : null}

      {anonymizeReport ? (
        <AnonymizedSampleDrawer report={anonymizeReport} onClose={() => setAnonymizeReport(null)} />
      ) : null}
    </main>
  )
}
