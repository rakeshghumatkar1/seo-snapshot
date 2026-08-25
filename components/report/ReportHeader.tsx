import BrandLogo from '@/components/brand/BrandLogo'
import {
  BRAND_NAME,
  REPORT_TAGLINE,
  displayDomain,
  formatReportDate,
  reportDocumentTitle,
} from '@/lib/report/presentation'

interface ReportHeaderProps {
  websiteUrl: string
  reportType: 'snapshot' | 'detailed'
  generatedAt?: Date
}

export default function ReportHeader({
  websiteUrl,
  reportType,
  generatedAt,
}: ReportHeaderProps) {
  const title = reportDocumentTitle(reportType)
  const domain = displayDomain(websiteUrl)
  const dateLabel = formatReportDate(generatedAt || new Date())

  return (
    <header className="report-doc-header" aria-labelledby="report-doc-title">
      <div className="report-doc-header-brand">
        <BrandLogo size="header" className="report-doc-logo" />
        <div className="report-doc-brand-text">
          <p className="report-doc-brand-name">{BRAND_NAME}</p>
          <p className="report-doc-tagline">{REPORT_TAGLINE}</p>
        </div>
        <span className={`report-doc-type-badge report-doc-type-${reportType}`}>
          {reportType === 'detailed' ? 'Detailed' : 'Snapshot'}
        </span>
      </div>

      <h1 id="report-doc-title" className="report-doc-title">
        {title}
      </h1>

      <dl className="report-doc-meta">
        <div>
          <dt>Prepared for</dt>
          <dd className="report-doc-domain">{domain}</dd>
        </div>
        <div>
          <dt>Generated</dt>
          <dd>{dateLabel}</dd>
        </div>
        <div>
          <dt>Analysed website</dt>
          <dd className="report-doc-url">{websiteUrl}</dd>
        </div>
      </dl>
    </header>
  )
}
