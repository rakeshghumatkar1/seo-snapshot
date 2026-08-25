'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import SampleReportDocument, {
  type SampleReportDocumentData,
} from '@/components/public/SampleReportDocument'

export default function SampleReportView({ slug }: { slug: string }) {
  const [data, setData] = useState<SampleReportDocumentData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/public/sample-report/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || 'Sample report not found')
        return json as SampleReportDocumentData & {
          isAnonymizedSample?: boolean
          sampleContentMode?: string
        }
      })
      .then((payload) => {
        if (cancelled) return
        setData({
          ...payload,
          isAnonymizedSample:
            Boolean(payload.isAnonymizedSample) ||
            payload.sampleContentMode === 'anonymized',
        })
      })
      .catch((err: Error) => {
        if (cancelled) return
        setError(err.message || 'Failed to load sample report')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="glass-elevated p-16 max-w-md mx-auto text-center">
          <div className="loader mx-auto mb-4" />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--t-300)' }}>
            Loading sample report…
          </p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="public-page-content max-w-xl mx-auto px-6 py-20 text-center">
        <p className="public-eyebrow mb-3">SAMPLE REPORT</p>
        <h1 className="public-heading-section mb-4">Sample unavailable</h1>
        <p className="public-body-md mb-8">
          {error || 'This sample report is no longer published.'}
        </p>
        <Link href="/" className="btn btn-primary">
          Back to homepage
        </Link>
      </div>
    )
  }

  return <SampleReportDocument data={data} />
}
