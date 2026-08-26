'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminOverview, { type OverviewStats } from '@/components/admin/AdminOverview'

type Stats = OverviewStats & {
  ratings?: {
    total: number
    avgRating: number
  }
  rateLimits?: {
    activeIps: number
    totalRequests: number
  }
}

export default function AdminDashboardOverviewPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => {
        if (r.status === 401) {
          router.push('/admin')
          return null
        }
        return r.json()
      })
      .then((data) => {
        if (data) setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader" />
      </div>
    )
  }

  if (!stats) {
    return (
      <main className="admin-page">
        <div className="admin-empty-state">Could not load overview stats.</div>
      </main>
    )
  }

  return (
    <main className="admin-page">
      <AdminOverview
        stats={stats}
        onOpenPromptEditor={() => router.push('/admin/dashboard/prompts')}
        onDomainClick={(domain) => {
          const host = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
          router.push(`/admin/dashboard/reports?q=${encodeURIComponent(host)}`)
        }}
      />
    </main>
  )
}
