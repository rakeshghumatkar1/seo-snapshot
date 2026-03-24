interface ReportHeaderProps {
  websiteUrl: string;
  reportType: 'snapshot' | 'detailed';
}

export default function ReportHeader({ websiteUrl, reportType }: ReportHeaderProps) {
  return (
    <div className="glass-elevated p-8 mb-8 relative">
      {/* Emerald accent line */}
      <div className="accent-line-top" />

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left */}
        <div>
          <div className="badge badge-emerald badge-dot mb-4">AI SEO REPORT</div>
          <h1
            className="break-all"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '26px',
              fontWeight: 700,
              color: 'var(--t-100)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            {websiteUrl}
          </h1>
          <p
            className="mt-1"
            style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--t-300)' }}
          >
            Generated just now · {reportType === 'detailed' ? 'Detailed' : 'Snapshot'} Report
          </p>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`badge ${reportType === 'detailed' ? 'badge-emerald' : 'badge-glass'}`}
            style={reportType === 'detailed' ? { boxShadow: 'var(--em-glow-sm)' } : {}}
          >
            {reportType === 'detailed' ? 'DETAILED' : 'SNAPSHOT'}
          </div>
          {/* Sparkle */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--em-400)' }}>
            <path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5L10 2z" fill="currentColor" opacity="0.8"/>
            <path d="M15 12l.75 2.25L18 15l-2.25.75L15 18l-.75-2.25L12 15l2.25-.75L15 12z" fill="currentColor" opacity="0.5"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
