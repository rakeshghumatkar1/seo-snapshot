'use client'

import Link from 'next/link'

export type OverviewStats = {
  leads: {
    total: number
    pdfCount: number
    detailedCount: number
  }
  reports: {
    total: number
    snapshotCount: number
    detailedCount: number
  }
  samples?: {
    published: number
    needsReview: number
  }
  shares?: {
    active: number
  }
  attention?: Array<{
    id: string
    label: string
    count: number
    href: string
    tone: 'warn' | 'info' | 'muted'
  }>
  recentLeads?: Array<{
    id: string
    email: string
    name: string | null
    company: string | null
    website_url: string
    requested_report_type: string
    created_at: string
  }>
  recentReports?: Array<{
    id: string
    website_url: string
    report_type: string
    created_at: string
    pdf_filename: string | null
    has_pdf: boolean
    sample_status: string | null
    share_status: string | null
  }>
  dailyReports: Array<{ date: string; count: number }>
  topDomains: Array<{ website_url: string; count: number }>
  todayActivity?: {
    requests: number
    uniqueIps: number
  }
}

function hostFromUrl(url: string) {
  return String(url || '')
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '')
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

function sampleBadge(status: string | null | undefined) {
  const value = String(status || 'none')
  if (value === 'published') return { label: 'Published', className: 'admin-badge admin-badge-success' }
  if (value === 'needs_review') return { label: 'Needs Review', className: 'admin-badge admin-badge-warn' }
  if (value === 'failed') return { label: 'Failed', className: 'admin-badge admin-badge-danger' }
  if (value === 'draft') return { label: 'Draft', className: 'admin-badge admin-badge-info' }
  return { label: 'None', className: 'admin-badge admin-badge-muted' }
}

function WeeklyBarChart({ data }: { data: Array<{ date: string; count: number }> }) {
  const days: Array<{ label: string; count: number }> = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('en-US', { weekday: 'short' })
    const found = data.find((r) => String(r.date).startsWith(iso))
    days.push({ label, count: found ? Number(found.count) : 0 })
  }
  const max = Math.max(...days.map((d) => d.count), 1)
  return (
    <div className="admin-overview-chart">
      {days.map((d, i) => (
        <div key={i} className="admin-overview-chart-col">
          <div className="admin-overview-chart-bar-wrap">
            <div
              className="admin-overview-chart-bar"
              title={`${d.count} reports`}
              style={{
                height: `${Math.max((d.count / max) * 100, d.count > 0 ? 8 : 0)}%`,
                opacity: d.count > 0 ? 1 : 0.35,
              }}
            />
          </div>
          <div className="admin-overview-chart-label">{d.label}</div>
          {d.count > 0 ? <div className="admin-overview-chart-count">{d.count}</div> : null}
        </div>
      ))}
    </div>
  )
}

type Props = {
  stats: OverviewStats
  onOpenPromptEditor: () => void
  onDomainClick: (domain: string) => void
}

export default function AdminOverview({ stats, onOpenPromptEditor, onDomainClick }: Props) {
  const publishedSamples = stats.samples?.published ?? 0
  const activeShares = stats.shares?.active ?? 0
  const attention = stats.attention || []
  const recentLeads = stats.recentLeads || []
  const recentReports = stats.recentReports || []

  const kpis = [
    {
      label: 'Total Leads',
      value: stats.leads.total,
      sub: `${stats.leads.detailedCount} detailed requests`,
      href: '/admin/dashboard/leads',
      accent: 'teal',
    },
    {
      label: 'Reports Generated',
      value: stats.reports.total,
      sub: `${stats.reports.snapshotCount} snapshot · ${stats.reports.detailedCount} detailed`,
      href: '/admin/dashboard/reports',
      accent: 'slate',
    },
    {
      label: 'Detailed Reports',
      value: stats.reports.detailedCount,
      sub: 'Full V3 reports',
      href: '/admin/dashboard/reports?type=detailed',
      accent: 'indigo',
    },
    {
      label: 'Snapshot Reports',
      value: stats.reports.snapshotCount,
      sub: 'Quick assessments',
      href: '/admin/dashboard/reports?type=snapshot',
      accent: 'sky',
    },
    {
      label: 'Published Samples',
      value: publishedSamples,
      sub: 'Live on homepage',
      href: '/admin/dashboard/reports?sample=published',
      accent: 'emerald',
    },
    {
      label: 'Active Shared PDFs',
      value: activeShares,
      sub: 'Public share links',
      href: '/admin/dashboard/reports?share=shared',
      accent: 'amber',
    },
  ]

  return (
    <div className="admin-overview">
      <div className="admin-overview-header">
        <div>
          <h1 className="admin-overview-title">Overview</h1>
          <p className="admin-overview-subtitle">
            Operational home for leads, reports, samples, and share links.
          </p>
        </div>
        <div className="admin-overview-header-meta">
          Today · {stats.todayActivity?.uniqueIps || 0} active IPs ·{' '}
          {stats.todayActivity?.requests || 0} requests
        </div>
      </div>

      <div className="admin-overview-kpis">
        {kpis.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`admin-overview-kpi admin-overview-kpi-${card.accent}`}
          >
            <div className="admin-overview-kpi-label">{card.label}</div>
            <div className="admin-overview-kpi-value">{card.value}</div>
            <div className="admin-overview-kpi-sub">{card.sub}</div>
          </Link>
        ))}
      </div>

      <div className="admin-panel admin-overview-actions-panel">
        <div className="admin-overview-panel-head">
          <h2>Quick Actions</h2>
        </div>
        <div className="admin-overview-actions">
          <Link href="/admin/dashboard/leads" className="admin-btn admin-btn-primary">
            View Leads
          </Link>
          <Link href="/admin/dashboard/reports" className="admin-btn admin-btn-primary">
            View Reports
          </Link>
          <Link
            href="/admin/dashboard/reports?sample=needs_review"
            className="admin-btn admin-btn-secondary"
          >
            Review Sample Drafts
          </Link>
          <Link
            href="/admin/dashboard/reports?share=shared"
            className="admin-btn admin-btn-secondary"
          >
            View Shared PDFs
          </Link>
          <button type="button" className="admin-btn admin-btn-ghost" onClick={onOpenPromptEditor}>
            Open Prompt Editor
          </button>
        </div>
      </div>

      <div className="admin-overview-split">
        <section className="admin-panel admin-overview-panel">
          <div className="admin-overview-panel-head">
            <h2>Recent Leads</h2>
            <Link href="/admin/dashboard/leads" className="admin-overview-link">
              View all →
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <div className="admin-overview-empty">No recent leads.</div>
          ) : (
            <div className="admin-overview-list">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="admin-overview-row">
                  <div className="admin-overview-row-main">
                    <div className="admin-overview-row-title">
                      {lead.company || hostFromUrl(lead.website_url) || 'Lead'}
                    </div>
                    <div className="admin-overview-row-meta">
                      {[lead.name, lead.email].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </div>
                  <div className="admin-overview-row-side">
                    <div className="admin-overview-row-date">{formatDate(lead.created_at)}</div>
                    <span className="admin-badge admin-badge-muted">
                      {lead.requested_report_type || 'report'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="admin-panel admin-overview-panel">
          <div className="admin-overview-panel-head">
            <h2>Recent Reports</h2>
            <Link href="/admin/dashboard/reports" className="admin-overview-link">
              View all →
            </Link>
          </div>
          {recentReports.length === 0 ? (
            <div className="admin-overview-empty">No recent reports.</div>
          ) : (
            <div className="admin-overview-list">
              {recentReports.map((report) => {
                const sample = sampleBadge(report.sample_status)
                return (
                  <div key={report.id} className="admin-overview-row admin-overview-row-report">
                    <div className="admin-overview-row-main">
                      <div className="admin-overview-row-title">
                        {hostFromUrl(report.website_url)}
                      </div>
                      <div className="admin-overview-row-meta">
                        {report.report_type} · {formatDate(report.created_at)}
                      </div>
                      <div className="admin-overview-row-badges">
                        <span
                          className={`admin-badge ${
                            report.has_pdf ? 'admin-badge-success' : 'admin-badge-warn'
                          }`}
                        >
                          {report.has_pdf ? 'PDF stored' : 'PDF missing'}
                        </span>
                        <span className={sample.className}>{sample.label}</span>
                        <span
                          className={`admin-badge ${
                            report.share_status === 'shared'
                              ? 'admin-badge-info'
                              : 'admin-badge-muted'
                          }`}
                        >
                          {report.share_status === 'shared' ? 'Shared' : 'Private'}
                        </span>
                      </div>
                    </div>
                    <div className="admin-overview-row-actions">
                      <Link
                        href={`/admin/dashboard/reports?q=${encodeURIComponent(
                          hostFromUrl(report.website_url)
                        )}`}
                        className="admin-btn admin-btn-secondary admin-btn-compact"
                      >
                        Open
                      </Link>
                      {report.has_pdf ? (
                        <a
                          href={`/api/admin/reports/${report.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="admin-btn admin-btn-ghost admin-btn-compact"
                        >
                          PDF
                        </a>
                      ) : null}
                      {report.share_status === 'shared' ? (
                        <Link
                          href="/admin/dashboard/reports?share=shared"
                          className="admin-btn admin-btn-ghost admin-btn-compact"
                        >
                          Share
                        </Link>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <div className="admin-overview-split admin-overview-split-secondary">
        <section className="admin-panel admin-overview-panel">
          <div className="admin-overview-panel-head">
            <h2>Needs Attention</h2>
          </div>
          {attention.length === 0 ? (
            <div className="admin-overview-empty">Nothing needs attention right now.</div>
          ) : (
            <div className="admin-overview-attention">
              {attention.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`admin-overview-attention-item admin-overview-attention-${item.tone}`}
                >
                  <span>{item.label}</span>
                  <span className="admin-overview-attention-go">Review →</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="admin-panel admin-overview-panel">
          <div className="admin-overview-panel-head">
            <h2>Activity This Week</h2>
            <span className="admin-overview-panel-note">Reports · last 7 days</span>
          </div>
          <WeeklyBarChart data={stats.dailyReports || []} />
          <div className="admin-overview-domains">
            <div className="admin-overview-domains-label">Top analyzed domains</div>
            <div className="admin-overview-domain-chips">
              {(stats.topDomains || []).slice(0, 6).map((d, i) => (
                <button
                  key={`${d.website_url}-${i}`}
                  type="button"
                  className="admin-overview-domain-chip"
                  onClick={() => onDomainClick(d.website_url)}
                >
                  <span>{hostFromUrl(d.website_url)}</span>
                  <span className="admin-overview-domain-count">{d.count}</span>
                </button>
              ))}
              {(stats.topDomains || []).length === 0 ? (
                <div className="admin-overview-empty" style={{ padding: '8px 0' }}>
                  No domain activity yet.
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
