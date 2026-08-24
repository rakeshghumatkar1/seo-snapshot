interface ReportHeaderProps {
  websiteUrl: string;
  reportType: 'snapshot' | 'detailed';
}

export default function ReportHeader({ websiteUrl, reportType }: ReportHeaderProps) {
  return (
    <div className="glass-elevated p-8 mb-8 relative">
      <div className="accent-line-top" />

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="badge badge-emerald badge-dot mb-4">SEO VISIBILITY REPORT</div>
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

        <div className="flex items-center gap-3 shrink-0">
          <div className={`badge ${reportType === 'detailed' ? 'badge-emerald' : 'badge-glass'}`}>
            {reportType === 'detailed' ? 'DETAILED' : 'SNAPSHOT'}
          </div>
        </div>
      </div>
    </div>
  );
}
