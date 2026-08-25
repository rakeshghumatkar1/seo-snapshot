'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ReportHeader from '@/components/report/ReportHeader'
import ReportSection from '@/components/report/ReportSection'
import ReportFooter from '@/components/report/ReportFooter'
import CTABlock from '@/components/report/CTABlock'
import ServiceHelpCTA from '@/components/public/ServiceHelpCTA'
import {
  getSectionLabel,
  iterableSectionEntries,
} from '@/lib/report/sectionLabels'
import { formatSectionNumber, isEmphasizedSection } from '@/lib/report/presentation'
import { detectReportVersion } from '@/types/report'

type SamplePayload = {
  slug: string
  displayName: string
  domain: string | null
  showDomain: boolean
  businessCategory: string | null
  reportType: 'snapshot' | 'detailed'
  reportVersion: 2 | 3
  generatedAt: string | null
  sections: Record<string, string>
}

export default function SampleReportView({ slug }: { slug: string }) {
  const [data, setData] = useState<SamplePayload | null>(null)
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
        return json as SamplePayload
      })
      .then((payload) => {
        if (cancelled) return
        setData(payload)
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

  const reportVersion = detectReportVersion(data.sections, data.reportVersion)
  const analysedUrl =
    data.showDomain && data.domain
      ? data.domain.startsWith('http')
        ? data.domain
        : `https://${data.domain}`
      : null

  return (
    <div className="public-page-content report-doc max-w-3xl mx-auto px-5 sm:px-6 py-10 sm:py-14">
      <ReportHeader
        websiteUrl={analysedUrl || data.displayName}
        reportType={data.reportType}
        generatedAt={data.generatedAt ? new Date(data.generatedAt) : undefined}
        preparedFor={data.displayName}
        analysedUrl={analysedUrl}
        isSample
      />

      {data.businessCategory ? (
        <p className="report-doc-sample-category">{data.businessCategory}</p>
      ) : null}

      <div className="report-doc-sections">
        {iterableSectionEntries(data.sections).map(([key, value], index) => {
          const label = getSectionLabel(key, data.reportType, reportVersion)
          return (
            <div key={key} className={`fade-up delay-${Math.min(index, 7)}`}>
              <ReportSection
                category={label.category}
                title={label.title}
                content={value}
                sectionNumber={formatSectionNumber(index)}
                emphasized={isEmphasizedSection(key, data.reportType, reportVersion)}
              />
            </div>
          )
        })}
      </div>

      <div className="report-doc-actions">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-center">
          <Link href="/tool" className="btn btn-primary btn-lg w-full sm:w-auto justify-center">
            Generate Your Free Snapshot →
          </Link>
        </div>
        <p className="report-doc-actions-note">
          This is a public sample. Your own report is generated from your website.
        </p>
      </div>

      <ServiceHelpCTA variant={data.reportType === 'snapshot' ? 'compact' : 'full'} />
      <CTABlock />
      <ReportFooter />
    </div>
  )
}
