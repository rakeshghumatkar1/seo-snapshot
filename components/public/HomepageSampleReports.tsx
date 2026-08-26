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
  previewText?: string | null
}

function ReportThumbnail({
  displayName,
  reportType,
}: {
  displayName: string
  reportType: 'snapshot' | 'detailed'
}) {
  const initial = (displayName.trim()[0] || 'S').toUpperCase()
  const title =
    displayName.trim().length > 42 ? `${displayName.trim().slice(0, 40).trim()}…` : displayName.trim()

  return (
    <div className="public-sample-thumb" aria-hidden="true">
      <div className="public-sample-thumb-doc">
        <div className="public-sample-thumb-header">
          <div className="public-sample-thumb-brand">
            <span className="public-sample-thumb-mark">{initial}</span>
            <span className="public-sample-thumb-brand-text">SEO Snapshot</span>
          </div>
          <span
            className={`public-sample-thumb-pill ${
              reportType === 'detailed' ? 'is-detailed' : 'is-snapshot'
            }`}
          >
            {reportType === 'detailed' ? 'Detailed' : 'Snapshot'}
          </span>
        </div>
        <div className="public-sample-thumb-title">{title || 'Sample Report'}</div>
        <div className="public-sample-thumb-meta">
          <span />
          <span />
        </div>
        <div className="public-sample-thumb-blocks">
          <div className="public-sample-thumb-block">
            <div className="public-sample-thumb-kicker" />
            <div className="public-sample-thumb-line long" />
            <div className="public-sample-thumb-line mid" />
            <div className="public-sample-thumb-line short" />
          </div>
          <div className="public-sample-thumb-block">
            <div className="public-sample-thumb-kicker" />
            <div className="public-sample-thumb-line mid" />
            <div className="public-sample-thumb-line short" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomepageSampleReports({
  samples,
}: {
  samples: SampleReportCard[]
}) {
  const [page, setPage] = useState(0)
  /** Desktop: 3 columns × 2 rows. Page-based nav when more than 6 samples. */
  const pageSize = 6
  const totalPages = Math.max(1, Math.ceil(samples.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const visible = useMemo(
    () => samples.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [samples, safePage]
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
                disabled={safePage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                ←
              </button>
              <button
                type="button"
                className="public-samples-nav-btn"
                aria-label="Next samples"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
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
                  {sample.previewText ? (
                    <p className="public-sample-excerpt">{sample.previewText}</p>
                  ) : null}
                  <Link
                    href={`/sample-report/${encodeURIComponent(sample.slug)}`}
                    className="public-sample-link"
                  >
                    View Report →
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
