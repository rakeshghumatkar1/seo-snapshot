'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'

interface Stats {
  leads: {
    total: number
    pdfCount: number
    detailedCount: number
  }
  ratings: {
    total: number
    avgRating: number
  }
  reports: {
    total: number
    snapshotCount: number
    detailedCount: number
  }
  rateLimits: {
    activeIps: number
    totalRequests: number
  }
  todayActivity?: {
    requests: number
    uniqueIps: number
  }
  dailyLeads: Array<{ date: string; count: number }>
  dailyReports: Array<{ date: string; count: number }>
  topDomains: Array<{ website_url: string; count: number }>
  ratingDistribution: Array<{ rating: number; count: number }>
}

type SectionName = 'Overview' | 'Prompt Editor' | 'Leads' | 'Reports' | 'Ratings' | 'Rate Limits'
type TableName = 'leads' | 'ratings' | 'reports' | 'rate_limits'

const NAV_ITEMS: SectionName[] = ['Overview', 'Prompt Editor', 'Leads', 'Reports', 'Ratings', 'Rate Limits']

const TABLE_MAP: Partial<Record<SectionName, TableName>> = {
  Leads: 'leads',
  Reports: 'reports',
  Ratings: 'ratings',
  'Rate Limits': 'rate_limits',
}

function WeeklyBarChart({ data }: { data: Array<{ date: string; count: number }> }) {
  const days: Array<{ label: string; count: number }> = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('en-US', { weekday: 'short' })
    const found = data.find(r => String(r.date).startsWith(iso))
    days.push({ label, count: found ? Number(found.count) : 0 })
  }
  const max = Math.max(...days.map(d => d.count), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '160px', paddingBottom: '4px' }}>
      {days.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%' }}>
          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
            <div
              title={`${d.count} reports`}
              style={{
                width: '100%',
                height: `${Math.max((d.count / max) * 100, d.count > 0 ? 6 : 0)}%`,
                background: d.count > 0 ? 'linear-gradient(to top, #10b981, #34d399)' : 'rgba(255,255,255,0.06)',
                borderRadius: '4px 4px 0 0',
                minHeight: '2px',
                transition: 'height 0.3s ease',
              }}
            />
          </div>
          <div style={{ fontSize: '10px', color: 'var(--t-400)', fontWeight: 500 }}>{d.label}</div>
          {d.count > 0 && <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 700, marginTop: '-4px' }}>{d.count}</div>}
        </div>
      ))}
    </div>
  )
}

function buildDiffLines(
  current: string,
  defaultContent: string
): Array<{ text: string; type: 'current' | 'default' | 'both' }> {
  const curLines = current.split('\n')
  const defLines = defaultContent.split('\n')
  const defSet = new Set(defLines)
  const curSet = new Set(curLines)
  const result: Array<{ text: string; type: 'current' | 'default' | 'both' }> = []
  for (const line of curLines) {
    result.push({ text: line, type: defSet.has(line) ? 'both' : 'current' })
  }
  for (const line of defLines) {
    if (!curSet.has(line)) {
      result.push({ text: line, type: 'default' })
    }
  }
  return result
}

export default function AdminDashboard() {
  const router = useRouter()

  // Core
  const [activeSection, setActiveSection] = useState<SectionName>('Overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  // Table
  const [tableData, setTableData] = useState<any[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [page, setPage] = useState(1)
  const [tableLoading, setTableLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [exportLoading, setExportLoading] = useState<string | null>(null)
  const [domainFilter, setDomainFilter] = useState<string | null>(null)

  // Prompts
  const [activePromptTab, setActivePromptTab] = useState<'snapshot' | 'detailed'>('snapshot')
  const [snapshotPrompt, setSnapshotPrompt] = useState('')
  const [detailedPrompt, setDetailedPrompt] = useState('')
  const [snapshotUpdatedAt, setSnapshotUpdatedAt] = useState<string | null>(null)
  const [detailedUpdatedAt, setDetailedUpdatedAt] = useState<string | null>(null)
  const [promptSaving, setPromptSaving] = useState(false)
  const [promptMessage, setPromptMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Security + validation
  const [skipValidation, setSkipValidation] = useState(false)
  const [missingKeys, setMissingKeys] = useState<string[]>([])

  // Session inactivity
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)
  const lastActivityRef = useRef<number>(Date.now())

  // History
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyEntries, setHistoryEntries] = useState<Array<{ id: number; key: string; content: string; saved_at: string }>>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [restoredFromHistory, setRestoredFromHistory] = useState(false)

  // Test prompt
  const [testUrl, setTestUrl] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testError, setTestError] = useState<string | null>(null)

  // Diff view
  const [diffOpen, setDiffOpen] = useState(false)
  const [defaultPromptContent, setDefaultPromptContent] = useState('')
  const [diffLoading, setDiffLoading] = useState(false)

  // Load stats
  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => {
        if (r.status === 401) { router.push('/admin'); return null }
        return r.json()
      })
      .then(data => { if (data) setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [router])

  // Load prompts
  useEffect(() => {
    fetch('/api/admin/prompts')
      .then(r => r.json())
      .then(data => {
        if (data.snapshot !== undefined) setSnapshotPrompt(data.snapshot)
        if (data.detailed !== undefined) setDetailedPrompt(data.detailed)
        if (data.snapshotUpdatedAt) setSnapshotUpdatedAt(data.snapshotUpdatedAt)
        if (data.detailedUpdatedAt) setDetailedUpdatedAt(data.detailedUpdatedAt)
      })
      .catch(() => {})
  }, [])

  // Load table when section or page changes
  const loadTable = useCallback(async (table: TableName, p: number) => {
    setTableLoading(true)
    try {
      const res = await fetch(`/api/admin/data?table=${table}&page=${p}&limit=20`)
      if (res.status === 401) { router.push('/admin'); return }
      const data = await res.json()
      setTableData(data.rows || [])
      setTotalRows(data.total || 0)
    } catch (err) {
      console.error('Table load failed:', err)
    } finally {
      setTableLoading(false)
    }
  }, [router])

  useEffect(() => {
    const table = TABLE_MAP[activeSection]
    if (table) loadTable(table, page)
  }, [activeSection, page, loadTable])

  function handleSectionChange(section: SectionName) {
    setActiveSection(section)
    if (section !== 'Reports') setDomainFilter(null)
    setSearchQuery('')
    setPage(1)
  }

  function handleDomainClick(domain: string) {
    setDomainFilter(domain)
    setActiveSection('Reports')
    setSearchQuery('')
    setPage(1)
  }

  async function exportCSV(table: TableName) {
    setExportLoading(`csv-${table}`)
    try {
      const res = await fetch(`/api/admin/export?table=${table}&format=csv`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${table}_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('CSV export failed:', err)
    } finally {
      setExportLoading(null)
    }
  }

  async function exportExcel(table: TableName) {
    setExportLoading(`excel-${table}`)
    try {
      const res = await fetch(`/api/admin/export?table=${table}&format=excel`)
      const data = await res.json()
      if (!data.rows?.length) { alert('No data to export'); return }
      const ws = XLSX.utils.json_to_sheet(data.rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, table)
      XLSX.writeFile(wb, `${table}_${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (err) {
      console.error('Excel export failed:', err)
    } finally {
      setExportLoading(null)
    }
  }

  async function savePrompt() {
    const key = activePromptTab === 'snapshot' ? 'snapshot_system_prompt' : 'detailed_system_prompt'
    const content = activePromptTab === 'snapshot' ? snapshotPrompt : detailedPrompt
    setPromptSaving(true)
    setPromptMessage(null)
    setMissingKeys([])
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, content, skipValidation }),
      })
      const data = await res.json()
      if (res.ok) {
        setPromptMessage({ type: 'success', text: 'Prompt saved' })
        setRestoredFromHistory(false)
        const now = new Date().toISOString()
        if (activePromptTab === 'snapshot') setSnapshotUpdatedAt(now)
        else setDetailedUpdatedAt(now)
        setTimeout(() => setPromptMessage(null), 3000)
      } else if (data.missing) {
        setMissingKeys(data.missing)
        setPromptMessage({ type: 'error', text: data.error || 'Validation failed' })
      } else {
        setPromptMessage({ type: 'error', text: data.error || 'Failed to save' })
        setTimeout(() => setPromptMessage(null), 3000)
      }
    } catch {
      setPromptMessage({ type: 'error', text: 'Network error' })
      setTimeout(() => setPromptMessage(null), 3000)
    } finally {
      setPromptSaving(false)
    }
  }

  async function loadDefault() {
    const key = activePromptTab === 'snapshot' ? 'snapshot_system_prompt' : 'detailed_system_prompt'
    try {
      const res = await fetch(`/api/admin/prompts/default?key=${key}`)
      const data = await res.json()
      if (data.content) {
        if (activePromptTab === 'snapshot') setSnapshotPrompt(data.content)
        else setDetailedPrompt(data.content)
      }
    } catch (err) {
      console.error('Load default failed:', err)
    }
  }

  async function clearPrompt() {
    const key = activePromptTab === 'snapshot' ? 'snapshot_system_prompt' : 'detailed_system_prompt'
    if (activePromptTab === 'snapshot') setSnapshotPrompt('')
    else setDetailedPrompt('')
    setPromptSaving(true)
    try {
      await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, content: '' }),
      })
      setPromptMessage({ type: 'success', text: 'Cleared — using fallback' })
      const now = new Date().toISOString()
      if (activePromptTab === 'snapshot') setSnapshotUpdatedAt(now)
      else setDetailedUpdatedAt(now)
    } catch {
      setPromptMessage({ type: 'error', text: 'Failed to clear' })
    } finally {
      setPromptSaving(false)
      setTimeout(() => setPromptMessage(null), 3000)
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin')
  }

  async function openHistory() {
    const key = activePromptTab === 'snapshot' ? 'snapshot_system_prompt' : 'detailed_system_prompt'
    setHistoryOpen(true)
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/admin/prompts/history?key=${key}`)
      const data = await res.json()
      setHistoryEntries(data.entries || [])
    } catch {
      setHistoryEntries([])
    } finally {
      setHistoryLoading(false)
    }
  }

  async function openDiff() {
    if (diffOpen) { setDiffOpen(false); return }
    const key = activePromptTab === 'snapshot' ? 'snapshot_system_prompt' : 'detailed_system_prompt'
    setDiffLoading(true)
    setDiffOpen(true)
    try {
      const res = await fetch(`/api/admin/prompts/default?key=${key}`)
      const data = await res.json()
      setDefaultPromptContent(data.content || '')
    } catch {
      setDefaultPromptContent('')
    } finally {
      setDiffLoading(false)
    }
  }

  async function runTest() {
    const key = activePromptTab === 'snapshot' ? 'snapshot_system_prompt' : 'detailed_system_prompt'
    const content = activePromptTab === 'snapshot' ? snapshotPrompt : detailedPrompt
    setTestLoading(true)
    setTestResult(null)
    setTestError(null)
    try {
      const res = await fetch('/api/admin/prompts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, content, url: testUrl }),
      })
      const data = await res.json()
      if (res.ok) {
        setTestResult(data.introduction || '')
      } else {
        setTestError(data.error || 'Test failed')
      }
    } catch {
      setTestError('Network error')
    } finally {
      setTestLoading(false)
    }
  }

  useEffect(() => {
    const WARN_AT = 30 * 60 * 1000
    const LOGOUT_AT = 35 * 60 * 1000
    const resetTimer = () => {
      lastActivityRef.current = Date.now()
      setShowInactivityWarning(false)
    }
    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('keydown', resetTimer)
    const interval = setInterval(async () => {
      const idle = Date.now() - lastActivityRef.current
      if (idle >= LOGOUT_AT) {
        await fetch('/api/admin/logout', { method: 'POST' })
        router.push('/admin')
      } else if (idle >= WARN_AT) {
        setShowInactivityWarning(true)
      }
    }, 30000)
    return () => {
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('keydown', resetTimer)
      clearInterval(interval)
    }
  }, [router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader" />
      </div>
    )
  }

  // Derived
  const currentTableName = TABLE_MAP[activeSection]
  const displayColumns = tableData.length > 0
    ? Object.keys(tableData[0]).filter(c => c !== 'id' && c !== 'company')
    : []
  const filteredData = tableData.filter(row => {
    if (activeSection === 'Reports' && domainFilter) {
      const url = String(row.website_url ?? '')
      const domain = domainFilter.replace(/https?:\/\//, '').replace(/\/$/, '')
      if (!url.includes(domain)) return false
    }
    if (searchQuery) {
      return Object.values(row).some(v =>
        String(v ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return true
  })
  const totalPages = Math.max(1, Math.ceil(totalRows / 20))
  const currentPrompt = activePromptTab === 'snapshot' ? snapshotPrompt : detailedPrompt
  const currentUpdatedAt = activePromptTab === 'snapshot' ? snapshotUpdatedAt : detailedUpdatedAt
  const charColor = currentPrompt.length >= 20000 ? '#f87171' : currentPrompt.length >= 15000 ? '#f59e0b' : '#34d399'
  const tokens = Math.round(currentPrompt.length / 4)
  const contextPct = Math.round((tokens / 128000) * 100)
  const tokenColor = tokens > 6000 ? '#f87171' : tokens >= 3000 ? '#f59e0b' : '#34d399'

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '10px 12px',
    borderBottom: '1px solid var(--glass-border)',
    color: 'var(--t-300)',
    fontWeight: 600,
    fontSize: '11px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  }
  const tdStyle: React.CSSProperties = {
    padding: '10px 12px',
    color: 'var(--t-200)',
    maxWidth: '220px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: '220px',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        background: 'rgba(0,0,0,0.45)',
        borderRight: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflowY: 'auto',
      }}>
        {/* Brand */}
        <div style={{ padding: '24px 20px 18px' }}>
          <div className="badge badge-emerald" style={{ marginBottom: '10px', fontSize: '10px' }}>
            ADMIN PANEL
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--t-100)',
            lineHeight: 1.35,
          }}>
            SEO Tool<br />Dashboard
          </div>
        </div>

        <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0 16px' }} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV_ITEMS.map(item => {
            const isActive = activeSection === item
            return (
              <button
                key={item}
                onClick={() => handleSectionChange(item)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 20px',
                  background: isActive ? 'rgba(16,185,129,0.1)' : 'transparent',
                  border: 'none',
                  boxShadow: isActive ? 'inset 3px 0 0 #10b981' : 'inset 3px 0 0 transparent',
                  color: isActive ? '#34d399' : 'var(--t-300)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  letterSpacing: '0.01em',
                  display: 'block',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                {item}
              </button>
            )
          })}
        </nav>

        {/* Sign out */}
        <div style={{ padding: '12px 16px 20px' }}>
          <div style={{ height: '1px', background: 'var(--glass-border)', marginBottom: '14px' }} />
          <button
            className="btn btn-ghost"
            onClick={handleLogout}
            style={{ width: '100%', fontSize: '13px' }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ marginLeft: '220px', flex: 1, padding: '32px 28px', minHeight: '100vh' }}>

        {/* ── OVERVIEW ── */}
        {activeSection === 'Overview' && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--t-100)', marginBottom: '24px' }}>
              Overview
            </h1>

            {/* Stat cards */}
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Total Leads', value: stats.leads.total, sub: `${stats.leads.pdfCount} PDF · ${stats.leads.detailedCount} Detailed`, color: '#10b981' },
                  { label: 'Reports Generated', value: stats.reports.total, sub: `${stats.reports.snapshotCount} Snapshot · ${stats.reports.detailedCount} Detailed`, color: '#6366f1' },
                  { label: 'Avg Rating', value: stats.ratings.avgRating ? `${stats.ratings.avgRating}★` : 'N/A', sub: `${stats.ratings.total} total ratings`, color: '#f59e0b' },
                  { label: 'Active Users Today', value: stats.todayActivity?.uniqueIps || stats.rateLimits.activeIps, sub: `${stats.todayActivity?.requests || stats.rateLimits.totalRequests} requests today`, color: '#3b82f6' },
                ].map(card => (
                  <div key={card.label} className="glass" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t-300)', marginBottom: '8px' }}>
                      {card.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: 800, color: card.color, lineHeight: 1, marginBottom: '6px' }}>
                      {card.value}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--t-400)' }}>{card.sub}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Chart + Domains row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Bar chart */}
              <div className="glass" style={{ padding: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--t-100)', marginBottom: '20px' }}>
                  Reports Last 7 Days
                </h2>
                <WeeklyBarChart data={stats?.dailyReports || []} />
              </div>

              {/* Top domains */}
              <div className="glass" style={{ padding: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--t-100)', marginBottom: '16px' }}>
                  Top Analyzed Domains
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(stats?.topDomains || []).slice(0, 8).map((d, i) => (
                    <button
                      key={i}
                      onClick={() => handleDomainClick(d.website_url)}
                      style={{
                        background: 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        color: 'var(--t-200)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.15)'
                        ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,185,129,0.4)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.08)'
                        ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,185,129,0.2)'
                      }}
                    >
                      <span>{d.website_url.replace(/https?:\/\//, '').replace(/\/$/, '')}</span>
                      <span style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '1px 7px', borderRadius: '100px', fontSize: '11px', fontWeight: 700 }}>
                        {d.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PROMPT EDITOR ── */}
        {activeSection === 'Prompt Editor' && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--t-100)', marginBottom: '24px' }}>
              Prompt Editor
            </h1>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {(['snapshot', 'detailed'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActivePromptTab(tab); setPromptMessage(null); setMissingKeys([]); setRestoredFromHistory(false); setDiffOpen(false); setTestResult(null); setTestError(null) }}
                  style={{
                    padding: '6px 18px',
                    borderRadius: '100px',
                    border: activePromptTab === tab ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--glass-border)',
                    background: activePromptTab === tab ? 'rgba(16,185,129,0.12)' : 'transparent',
                    color: activePromptTab === tab ? '#34d399' : 'var(--t-300)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {tab === 'snapshot' ? 'Snapshot Prompt' : 'Detailed Prompt'}
                </button>
              ))}
            </div>

            {/* Two-panel */}
            <div style={{ display: 'grid', gridTemplateColumns: '60% 1fr', gap: '20px', alignItems: 'start' }}>
              {/* Left: textarea + diff + test */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="glass" style={{ padding: '24px' }}>
                  {restoredFromHistory && (
                    <div style={{ marginBottom: '12px', padding: '10px 14px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', fontSize: '12px', color: '#f59e0b', fontWeight: 600 }}>
                      Restored from history — click Save to apply
                    </div>
                  )}
                  <textarea
                    value={currentPrompt}
                    onChange={e => {
                      if (activePromptTab === 'snapshot') setSnapshotPrompt(e.target.value)
                      else setDetailedPrompt(e.target.value)
                      if (missingKeys.length > 0) setMissingKeys([])
                    }}
                    placeholder="Enter custom system prompt here..."
                    style={{
                      width: '100%',
                      minHeight: '600px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      padding: '16px',
                      color: 'var(--t-100)',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      lineHeight: '1.65',
                      resize: 'vertical',
                      outline: 'none',
                      boxSizing: 'border-box',
                      display: 'block',
                    }}
                  />
                  <div style={{ marginTop: '8px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: charColor }}>
                    {currentPrompt.length.toLocaleString()} / 20,000 characters
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-primary"
                      onClick={savePrompt}
                      disabled={promptSaving}
                      style={{ padding: '8px 24px', fontSize: '13px' }}
                    >
                      {promptSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={openHistory}
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                      History
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={openDiff}
                      disabled={diffLoading}
                      style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        background: diffOpen ? 'rgba(99,102,241,0.12)' : undefined,
                        borderColor: diffOpen ? 'rgba(99,102,241,0.4)' : undefined,
                        color: diffOpen ? '#818cf8' : undefined,
                      }}
                    >
                      {diffLoading ? 'Loading...' : diffOpen ? 'Close Diff' : 'Compare with Default'}
                    </button>
                    {promptMessage && (
                      <span style={{ fontSize: '13px', fontWeight: 600, color: promptMessage.type === 'success' ? '#34d399' : '#f87171' }}>
                        {promptMessage.text}
                      </span>
                    )}
                  </div>
                  {missingKeys.length > 0 && (
                    <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>Missing required section keys:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {missingKeys.map(k => (
                          <span key={k} style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '4px', color: '#f87171', fontFamily: 'monospace' }}>
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <label style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--t-400)' }}>
                    <input
                      type="checkbox"
                      checked={skipValidation}
                      onChange={e => setSkipValidation(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    Skip section key validation (testing only)
                  </label>
                </div>

                {/* Diff view */}
                {diffOpen && !diffLoading && (
                  <div className="glass" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--t-300)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                        Comparing DB version vs Hardcoded Default
                      </div>
                      <button onClick={() => setDiffOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--t-400)', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '10px', fontSize: '11px', color: 'var(--t-400)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', background: 'rgba(52,211,153,0.25)', borderRadius: '2px', display: 'inline-block' }} />DB only</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', background: 'rgba(248,113,113,0.25)', borderRadius: '2px', display: 'inline-block' }} />Hardcoded only</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', display: 'inline-block' }} />Both</span>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.6', border: '1px solid var(--glass-border)', borderRadius: '6px', padding: '8px' }}>
                      {buildDiffLines(currentPrompt, defaultPromptContent).map((line, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '1px 6px',
                            background: line.type === 'current' ? 'rgba(52,211,153,0.1)' : line.type === 'default' ? 'rgba(248,113,113,0.1)' : 'transparent',
                            color: line.type === 'current' ? '#34d399' : line.type === 'default' ? '#f87171' : 'var(--t-400)',
                            whiteSpace: 'pre-wrap' as const,
                            wordBreak: 'break-all' as const,
                          }}
                        >
                          {line.type === 'current' ? '+ ' : line.type === 'default' ? '- ' : '  '}{line.text || ' '}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test Prompt */}
                <div className="glass" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--t-300)', marginBottom: '14px' }}>
                    Test this prompt on a URL
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      value={testUrl}
                      onChange={e => setTestUrl(e.target.value)}
                      placeholder="https://example.com"
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', color: 'var(--t-100)', fontSize: '13px', outline: 'none' }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={runTest}
                      disabled={testLoading || !testUrl.trim()}
                      style={{ padding: '8px 20px', fontSize: '13px', flexShrink: 0 }}
                    >
                      {testLoading ? 'Running...' : 'Run Test'}
                    </button>
                  </div>
                  {testLoading && (
                    <div style={{ textAlign: 'center', padding: '24px' }}>
                      <div className="loader" style={{ margin: '0 auto' }} />
                      <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--t-400)' }}>Running AI test...</div>
                    </div>
                  )}
                  {testError && (
                    <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', fontSize: '12px', color: '#f87171', fontWeight: 600 }}>
                      {testError}
                    </div>
                  )}
                  {testResult !== null && !testLoading && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '8px', letterSpacing: '0.04em' }}>INTRODUCTION preview:</div>
                      <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '12px', color: 'var(--t-200)', lineHeight: '1.7', whiteSpace: 'pre-wrap' as const, maxHeight: '400px', overflowY: 'auto' }}>
                        {testResult}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: status + actions + preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Status */}
                <div className="glass" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--t-300)', marginBottom: '14px' }}>
                    Status
                  </div>
                  {[
                    {
                      label: 'Active Source',
                      value: currentPrompt
                        ? <span style={{ color: '#34d399', fontWeight: 700 }}>DB Custom</span>
                        : <span style={{ color: '#f59e0b', fontWeight: 700 }}>Hardcoded Fallback</span>,
                    },
                    {
                      label: 'Characters',
                      value: <span style={{ color: charColor, fontWeight: 600 }}>{currentPrompt.length.toLocaleString()}</span>,
                    },
                    {
                      label: 'Est. Tokens',
                      value: <span style={{ color: tokenColor, fontWeight: 600 }}>{tokens.toLocaleString()}</span>,
                    },
                    {
                      label: 'Last Updated',
                      value: currentUpdatedAt
                        ? new Date(currentUpdatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '—',
                    },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--t-400)' }}>{label}</span>
                      <span style={{ fontSize: '12px', color: 'var(--t-200)' }}>{value}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--t-400)' }}>
                    ~{contextPct}% of GPT-4 Turbo context used by prompt
                  </div>
                </div>

                {/* Actions */}
                <div className="glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--t-300)', marginBottom: '4px' }}>
                    Actions
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={loadDefault}
                    style={{ width: '100%', fontSize: '12px', padding: '9px 14px' }}
                  >
                    Load Hardcoded Default
                  </button>
                  <button
                    onClick={clearPrompt}
                    disabled={promptSaving}
                    style={{
                      width: '100%',
                      padding: '9px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(248,113,113,0.3)',
                      background: 'rgba(248,113,113,0.08)',
                      color: '#f87171',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    Clear &amp; Use Fallback
                  </button>
                </div>

                {/* Preview */}
                <div className="glass" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t-300)', marginBottom: '12px' }}>
                    Preview (first 200 chars)
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--t-400)', fontFamily: 'monospace', lineHeight: '1.6', wordBreak: 'break-word', minHeight: '56px' }}>
                    {currentPrompt
                      ? currentPrompt.substring(0, 200) + (currentPrompt.length > 200 ? '...' : '')
                      : <span style={{ fontStyle: 'italic' }}>No custom prompt set</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TABLE SECTIONS ── */}
        {currentTableName && (
          <div>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--t-100)', margin: 0, flexShrink: 0 }}>
                  {activeSection}
                </h1>

                {domainFilter && activeSection === 'Reports' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '100px', padding: '3px 10px', fontSize: '12px', color: '#34d399', flexShrink: 0 }}>
                    <span>{domainFilter.replace(/https?:\/\//, '').replace(/\/$/, '')}</span>
                    <button onClick={() => setDomainFilter(null)} style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', padding: 0, fontSize: '15px', lineHeight: 1 }}>×</button>
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ flex: 1, maxWidth: '260px', padding: '7px 13px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', color: 'var(--t-100)', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => exportCSV(currentTableName)}
                  disabled={!!exportLoading}
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  {exportLoading === `csv-${currentTableName}` ? 'Exporting...' : '↓ CSV'}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => exportExcel(currentTableName)}
                  disabled={!!exportLoading}
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  {exportLoading === `excel-${currentTableName}` ? 'Exporting...' : '↓ Excel'}
                </button>
              </div>
            </div>

            {/* Table card */}
            <div className="glass" style={{ padding: '20px' }}>
              <div style={{ fontSize: '13px', color: 'var(--t-400)', marginBottom: '14px' }}>
                {totalRows} total rows · Page {page} of {totalPages}
              </div>

              {tableLoading ? (
                <div style={{ textAlign: 'center', padding: '48px' }}>
                  <div className="loader" style={{ margin: '0 auto' }} />
                </div>
              ) : filteredData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--t-300)', fontSize: '14px' }}>
                  {searchQuery || domainFilter ? 'No matching rows on this page' : `No data in ${activeSection.toLowerCase()}`}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, width: '44px' }}>#</th>
                        {displayColumns.map(col => (
                          <th key={col} style={thStyle}>{col.replace(/_/g, ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((row, i) => (
                        <tr
                          key={i}
                          style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        >
                          <td style={{ ...tdStyle, color: 'var(--t-400)', fontSize: '12px' }}>
                            {(page - 1) * 20 + i + 1}
                          </td>
                          {displayColumns.map(col => (
                            <td key={col} title={String(row[col] ?? '')} style={tdStyle}>
                              {col === 'rating' ? (
                                <span style={{ color: '#f59e0b' }}>{'★'.repeat(Number(row[col]))}</span>
                              ) : col.includes('_at') || col === 'created_at' ? (
                                row[col] ? new Date(row[col]).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
                              ) : col === 'value' && row[col] === 'true' ? (
                                <span style={{ color: '#34d399' }}>✓ enabled</span>
                              ) : String(row[col] ?? '—')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '20px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{ padding: '6px 14px', fontSize: '13px' }}
                  >
                    ← Prev
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pn: number
                    if (totalPages <= 5) pn = i + 1
                    else if (page <= 3) pn = i + 1
                    else if (page >= totalPages - 2) pn = totalPages - 4 + i
                    else pn = page - 2 + i
                    return (
                      <button
                        key={pn}
                        onClick={() => setPage(pn)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: page === pn ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--glass-border)',
                          background: page === pn ? 'rgba(16,185,129,0.12)' : 'transparent',
                          color: page === pn ? '#34d399' : 'var(--t-300)',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          minWidth: '36px',
                        }}
                      >
                        {pn}
                      </button>
                    )
                  })}

                  <button
                    className="btn btn-ghost"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    style={{ padding: '6px 14px', fontSize: '13px' }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Modal */}
        {historyOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ width: '100%', maxWidth: '640px', background: '#0f1117', border: '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--t-100)' }}>
                  Prompt History — {activePromptTab === 'snapshot' ? 'Snapshot' : 'Detailed'}
                </div>
                <button onClick={() => setHistoryOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--t-400)', cursor: 'pointer', fontSize: '22px', lineHeight: 1 }}>×</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                {historyLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="loader" style={{ margin: '0 auto' }} />
                  </div>
                ) : historyEntries.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--t-400)', fontSize: '14px' }}>No history available yet</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {historyEntries.map(entry => (
                      <div key={entry.id} style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--t-400)' }}>
                            {new Date(entry.saved_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <button
                            className="btn btn-secondary"
                            onClick={() => {
                              if (activePromptTab === 'snapshot') setSnapshotPrompt(entry.content)
                              else setDetailedPrompt(entry.content)
                              setRestoredFromHistory(true)
                              setHistoryOpen(false)
                              setMissingKeys([])
                            }}
                            style={{ fontSize: '11px', padding: '4px 12px' }}
                          >
                            Restore
                          </button>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--t-400)', fontFamily: 'monospace', lineHeight: '1.5', wordBreak: 'break-word' }}>
                          {entry.content.substring(0, 120)}{entry.content.length > 120 ? '...' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Inactivity warning banner */}
        {showInactivityWarning && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300, background: 'rgba(245,158,11,0.15)', borderBottom: '1px solid rgba(245,158,11,0.35)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b' }}>
              Your session will expire in 5 minutes due to inactivity
            </span>
            <button
              onClick={() => { lastActivityRef.current = Date.now(); setShowInactivityWarning(false) }}
              style={{ background: 'none', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '6px', padding: '4px 14px', color: '#f59e0b', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
            >
              Stay Active
            </button>
          </div>
        )}

      </main>
    </div>
  )
}
