'use client'

import { useState, useEffect, useCallback } from 'react'
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
  dailyLeads: Array<{ date: string; count: number }>
  topDomains: Array<{ website_url: string; count: number }>
  ratingDistribution: Array<{ rating: number; count: number }>
}

type TableName = 'leads' | 'ratings' | 'reports' | 'rate_limits'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeTable, setActiveTable] = useState<TableName>('leads')
  const [tableData, setTableData] = useState<any[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState<string | null>(null)

  // Load stats
  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => {
        if (r.status === 401) {
          router.push('/admin')
          return null
        }
        return r.json()
      })
      .then(data => {
        if (data) setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  // Load table data
  const loadTable = useCallback(async (table: TableName, p: number = 1) => {
    setTableLoading(true)
    try {
      const res = await fetch(
        `/api/admin/data?table=${table}&page=${p}&limit=20`
      )
      if (res.status === 401) {
        router.push('/admin')
        return
      }
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
    loadTable(activeTable, page)
  }, [activeTable, page, loadTable])

  // Export CSV
  async function exportCSV(table: TableName) {
    setExportLoading(`csv-${table}`)
    try {
      const res = await fetch(
        `/api/admin/export?table=${table}&format=csv`
      )
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

  // Export Excel
  async function exportExcel(table: TableName) {
    setExportLoading(`excel-${table}`)
    try {
      const res = await fetch(
        `/api/admin/export?table=${table}&format=excel`
      )
      const data = await res.json()

      if (!data.rows?.length) {
        alert('No data to export')
        return
      }

      const ws = XLSX.utils.json_to_sheet(data.rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, table)

      // Style the header row
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c })
        if (!ws[addr]) continue
        ws[addr].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: '10b981' } },
        }
      }

      XLSX.writeFile(
        wb,
        `${table}_${new Date().toISOString().split('T')[0]}.xlsx`
      )
    } catch (err) {
      console.error('Excel export failed:', err)
    } finally {
      setExportLoading(null)
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin')
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div className="loader" />
      </div>
    )
  }

  const tables: TableName[] = ['leads', 'ratings', 'reports', 'rate_limits']

  const columns = tableData.length > 0 ? Object.keys(tableData[0]) : []

  return (
    <div style={{
      minHeight: '100vh',
      padding: '32px 24px',
      maxWidth: '1400px',
      margin: '0 auto',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
      }}>
        <div>
          <div className="badge badge-emerald" style={{ marginBottom: '8px' }}>
            ADMIN PANEL
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--t-100)',
          }}>
            SEO Tool Dashboard
          </h1>
        </div>
        <button className="btn btn-ghost" onClick={handleLogout}>
          Sign Out
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}>
          {[
            {
              label: 'Total Leads',
              value: stats.leads.total,
              sub: `${stats.leads.pdfCount} PDF · ${stats.leads.detailedCount} Detailed`,
              color: '#10b981',
            },
            {
              label: 'Reports Generated',
              value: stats.reports.total,
              sub: `${stats.reports.snapshotCount} Snapshot · ${stats.reports.detailedCount} Detailed`,
              color: '#6366f1',
            },
            {
              label: 'Avg Rating',
              value: stats.ratings.avgRating ? `${stats.ratings.avgRating}★` : 'N/A',
              sub: `${stats.ratings.total} total ratings`,
              color: '#f59e0b',
            },
            {
              label: 'Active Users Today',
              value: stats.rateLimits.activeIps,
              sub: `${stats.rateLimits.totalRequests} total requests`,
              color: '#3b82f6',
            },
          ].map(card => (
            <div key={card.label} className="glass" style={{ padding: '20px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: 'var(--t-300)',
                marginBottom: '8px',
              }}>
                {card.label}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '32px',
                fontWeight: 800,
                color: card.color,
                lineHeight: 1,
                marginBottom: '6px',
              }}>
                {card.value}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'var(--t-400)',
              }}>
                {card.sub}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top Domains */}
      {stats?.topDomains && stats.topDomains.length > 0 && (
        <div className="glass" style={{
          padding: '24px',
          marginBottom: '32px',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--t-100)',
            marginBottom: '16px',
          }}>
            Top Analyzed Domains
          </h2>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '8px',
          }}>
            {stats.topDomains.map((d, i) => (
              <div key={i} style={{
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '13px',
                color: 'var(--t-200)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span>{d.website_url}</span>
                <span style={{
                  background: 'rgba(16,185,129,0.2)',
                  color: '#34d399',
                  padding: '2px 8px',
                  borderRadius: '100px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}>
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="glass" style={{ padding: '24px' }}>
        {/* Table Tabs + Export */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap' as const,
          gap: '12px',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
            {tables.map(t => (
              <button
                key={t}
                onClick={() => {
                  setActiveTable(t)
                  setPage(1)
                }}
                style={{
                  padding: '6px 16px',
                  borderRadius: '100px',
                  border: activeTable === t
                    ? '1px solid rgba(16,185,129,0.4)'
                    : '1px solid var(--glass-border)',
                  background: activeTable === t
                    ? 'rgba(16,185,129,0.12)'
                    : 'transparent',
                  color: activeTable === t
                    ? '#34d399'
                    : 'var(--t-300)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize' as const,
                  transition: 'all 0.2s',
                }}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Export Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => exportCSV(activeTable)}
              disabled={!!exportLoading}
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              {exportLoading === `csv-${activeTable}` ? 'Exporting...' : '↓ CSV'}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => exportExcel(activeTable)}
              disabled={!!exportLoading}
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              {exportLoading === `excel-${activeTable}` ? 'Exporting...' : '↓ Excel'}
            </button>
          </div>
        </div>

        {/* Row count */}
        <div style={{
          fontSize: '13px',
          color: 'var(--t-300)',
          marginBottom: '12px',
        }}>
          {totalRows} total rows · Page {page} of {Math.max(1, Math.ceil(totalRows / 20))}
        </div>

        {/* Table */}
        {tableLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loader" style={{ margin: '0 auto' }} />
          </div>
        ) : tableData.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--t-300)',
            fontSize: '15px',
          }}>
            No data yet in {activeTable}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse' as const,
              fontSize: '13px',
            }}>
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col} style={{
                      textAlign: 'left' as const,
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--glass-border)',
                      color: 'var(--t-300)',
                      fontWeight: 600,
                      fontSize: '11px',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const,
                      whiteSpace: 'nowrap' as const,
                    }}>
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, i) => (
                  <tr key={i} style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}>
                    {columns.map(col => (
                      <td key={col} style={{
                        padding: '10px 12px',
                        color: 'var(--t-200)',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap' as const,
                      }}>
                        {col === 'rating' ? (
                          <span style={{ color: '#f59e0b' }}>
                            {'★'.repeat(Number(row[col]))}
                          </span>
                        ) : col.includes('_at') || col === 'created_at' ? (
                          row[col] ? new Date(row[col]).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : '—'
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
        {totalRows > 20 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '20px',
          }}>
            <button
              className="btn btn-ghost"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '6px 16px', fontSize: '13px' }}
            >
              ← Previous
            </button>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '13px',
              color: 'var(--t-300)',
              padding: '0 12px',
            }}>
              {page} / {Math.ceil(totalRows / 20)}
            </span>
            <button
              className="btn btn-ghost"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(totalRows / 20)}
              style={{ padding: '6px 16px', fontSize: '13px' }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
