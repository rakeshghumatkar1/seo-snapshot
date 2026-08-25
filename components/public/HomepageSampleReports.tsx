'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

export type SampleReportCard = {
  slug: string
  displayName: string
  domain: string | null
  showDomain: boolean
  reportType: 'snapshot' | 'detailed'
  businessCategory: string | null
  publicLocation?: string | null
  sampleContentMode?: 'source' | 'anonymized'
  featured?: boolean
}

function ReportThumbnail({
  displayName,
  reportType,
}: {
  displayName: string
  reportType: 'snapshot' | 'detailed'
}) {
  const initial = (displayName.trim()[0] || 'S').toUpperCase()
  return (
    <div className="public-sample-thumb" aria-hidden="true">
      <div className="public-sample-thumb-doc">
        <div className="public-sample-thumb-bar" />
        <div className="public-sample-thumb-line long" />
        <div className="public-sample-thumb-line mid" />
        <div className="public-sample-thumb-line short" />
        <div className="public-sample-thumb-badge">
          {reportType === 'detailed' ? 'Detailed' : 'Snapshot'}
        </div>
        <span className="public-sample-thumb-initial">{initial}</span>
      </div>
    </div>
  )
}

export default function HomepageSampleReports({
  samples,
}: {
  samples: SampleReportCard[]
}) {
  const [index, setIndex] = useState(0)
  const pageSize = 3
  const maxIndex = Math.max(0, samples.length - pageSize)
  const visible = useMemo(
    () => samples.slice(index, index + pageSize),
    [samples, index]
  )

  if (!samples.length) return null

  return (
    <section className="public-section-samples public-section-compact" aria-label="Sample reports">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10 lg:mb-12">
          <p className="public-eyebrow public-eyebrow-on-light mb-3">SEE A REAL REPORT</p>
          <h2 className="public-heading-section public-section-title">
            Explore Sample Reports Before Generating Your Own.
          </h2>
          <p className="public-body-lg public-samples-intro">
            See the type of business-focused guidance the report provides.
          </p>
        </div>

        <div className="public-samples-carousel">
          {samples.length > pageSize && (
            <div className="public-samples-nav">
              <button
                type="button"
                className="public-samples-nav-btn"
                aria-label="Previous samples"
                disabled={index === 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
              >
                ←
              </button>
              <button
                type="button"
                className="public-samples-nav-btn"
                aria-label="Next samples"
                disabled={index >= maxIndex}
                onClick={() => setIndex((i) => Math.min(maxIndex, i + 1))}
              >
                →
              </button>
            </div>
          )}

          <div className="public-samples-grid">
            {visible.map((sample) => (
              <article key={sample.slug} className="public-sample-card">
                <ReportThumbnail
                  displayName={sample.displayName}
                  reportType={sample.reportType}
                />
                <div className="public-sample-card-body">
                  <span
                    className={`public-sample-type ${
                      sample.reportType === 'detailed' ? 'is-detailed' : 'is-snapshot'
                    }`}
                  >
                    {sample.reportType === 'detailed' ? 'Detailed Report' : 'Snapshot Report'}
                  </span>
                  <h3 className="public-sample-name">{sample.displayName}</h3>
                  {sample.showDomain && sample.domain ? (
                    <p className="public-sample-domain">{sample.domain}</p>
                  ) : sample.publicLocation ? (
                    <p className="public-sample-domain">{sample.publicLocation}</p>
                  ) : null}
                  {sample.businessCategory ? (
                    <p className="public-sample-category">{sample.businessCategory}</p>
                  ) : null}
                  <Link
                    href={`/sample-report/${encodeURIComponent(sample.slug)}`}
                    className="public-sample-link"
                  >
                    View Sample Report →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
