'use client'

type UsageStats = {
  websitesAnalysed: number
  reportsGenerated: number
  detailedReportsCreated: number
}

function StatIcon({ kind }: { kind: 'sites' | 'reports' | 'detailed' }) {
  if (kind === 'sites') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
        />
      </svg>
    )
  }
  if (kind === 'detailed') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    )
  }
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )
}

export default function HomepageUsageStats({
  stats,
}: {
  stats: UsageStats
}) {
  const cards = [
    { label: 'Websites Analysed', value: stats.websitesAnalysed, kind: 'sites' as const },
    { label: 'Reports Generated', value: stats.reportsGenerated, kind: 'reports' as const },
    {
      label: 'Detailed Reports Created',
      value: stats.detailedReportsCreated,
      kind: 'detailed' as const,
    },
  ]

  return (
    <section className="public-section-stats public-section-compact" aria-label="Real tool usage">
      <div className="max-w-5xl mx-auto px-6">
        <p className="public-stats-kicker">Real tool usage</p>
        <div className="public-stats-grid">
          {cards.map((card) => (
            <div key={card.label} className="public-stat-card">
              <div className="public-stat-icon" aria-hidden="true">
                <StatIcon kind={card.kind} />
              </div>
              <p className="public-stat-label">{card.label}</p>
              <p className="public-stat-value">{card.value.toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
