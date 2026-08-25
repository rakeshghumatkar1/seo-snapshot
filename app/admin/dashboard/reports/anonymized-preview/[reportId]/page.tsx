'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import SampleReportDocument, {
  type SampleReportDocumentData,
} from '@/components/public/SampleReportDocument'

export default function AnonymizedPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = String(params?.reportId || '')
  const [data, setData] = useState<SampleReportDocumentData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/admin/showcase/anonymize?reportId=${encodeURIComponent(reportId)}`,
          { cache: 'no-store' }
        )
        if (res.status === 401) {
          router.push('/admin')
          return
        }
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load preview')
        const preview = json.preview
        if (!preview?.sections || !Object.keys(preview.sections).length) {
          throw new Error('No anonymised draft to preview yet')
        }
        if (cancelled) return
        setData({
          displayName: preview.displayName || 'Anonymised Sample',
          domain: null,
          showDomain: false,
          businessCategory: preview.businessCategory,
          publicLocation: preview.publicLocation,
          reportType: preview.reportType,
          reportVersion: (preview.reportVersion === 2 ? 2 : 3) as 2 | 3,
          generatedAt: preview.generatedAt,
          sections: preview.sections,
          isAnonymizedSample: true,
        })
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Preview failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (reportId) load()
    return () => {
      cancelled = true
    }
  }, [reportId, router])

  return (
    <main style={{ minHeight: '100vh', background: '#f7f8fb' }}>
      <div style={{ maxWidth: '920px', margin: '0 auto', padding: '18px 16px 8px', display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', color: '#059669' }}>ADMIN PREVIEW</div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Exact public sample presentation · draft may be unpublished</div>
        </div>
        <Link href="/admin/dashboard/reports" className="btn btn-secondary" style={{ textDecoration: 'none', fontSize: '12px' }}>
          ← Reports Library
        </Link>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '80px' }}><div className="loader" style={{ margin: '0 auto' }} /></div>
      )}
      {error && (
        <div style={{ maxWidth: '640px', margin: '40px auto', padding: '16px', borderRadius: '10px', background: '#fff', border: '1px solid #fecaca', color: '#b91c1c' }}>
          {error}
        </div>
      )}
      {!loading && !error && data && (
        <div className="public-site">
          <SampleReportDocument data={data} hidePublicCta />
        </div>
      )}
    </main>
  )
}
