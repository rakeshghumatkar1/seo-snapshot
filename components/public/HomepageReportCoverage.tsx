'use client'

import type { HomepageCoverageMarket } from '@/lib/homepage/coverageMarkets'

export type { HomepageCoverageMarket }

export default function HomepageReportCoverage({
  markets,
}: {
  markets: HomepageCoverageMarket[]
}) {
  if (!markets.length) return null

  const countClass =
    markets.length === 1
      ? 'is-count-1'
      : markets.length <= 3
        ? 'is-count-few'
        : 'is-count-many'

  return (
    <section
      className="public-section-coverage public-section-compact"
      aria-label="Report coverage"
    >
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-8">
          <p className="public-eyebrow public-eyebrow-on-light mb-3">REPORT COVERAGE</p>
          <h2 className="public-heading-section public-section-title">
            Reports Across Industries & Markets
          </h2>
          <p className="public-body-md public-coverage-intro">
            Explore the industries and markets represented across our anonymised business-growth
            reports.
          </p>
        </div>

        <ul className={`public-coverage-grid ${countClass}`}>
          {markets.map((item) => {
            const key = `${item.businessCategory || ''}|${item.publicLocation || ''}`
            return (
              <li key={key} className="public-coverage-card">
                <span className="public-coverage-cue" aria-hidden="true">
                  {item.businessCategory ? 'INDUSTRY' : 'MARKET'}
                </span>
                {item.businessCategory ? (
                  <span className="public-coverage-category">{item.businessCategory}</span>
                ) : null}
                {item.publicLocation ? (
                  <span className="public-coverage-location">{item.publicLocation}</span>
                ) : null}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
