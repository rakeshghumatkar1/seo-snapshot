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
  /** Override “Prepared for” label (e.g. public sample display name). */
  preparedFor?: string
  /** Override analysed website URL; pass null to hide the row. */
  analysedUrl?: string | null
  isSample?: boolean
  /** Optional short disclosure under the sample label. */
  sampleDisclosure?: string
}

export default function ReportHeader({
  websiteUrl,
  reportType,
  generatedAt,
  preparedFor,
  analysedUrl,
  isSample = false,
  sampleDisclosure,
}: ReportHeaderProps) {
  const title = reportDocumentTitle(reportType)
  const domain = preparedFor?.trim() || displayDomain(websiteUrl)
  const dateLabel = formatReportDate(generatedAt || new Date())
  const showAnalysed =
    analysedUrl === undefined ? true : analysedUrl !== null && analysedUrl !== ''
  const analysedValue =
    analysedUrl === undefined ? websiteUrl : analysedUrl || ''

  return (
    <header className="report-doc-header" aria-labelledby="report-doc-title">
      {isSample && (
        <p className="report-doc-sample-label">
          {sampleDisclosure || 'Sample Report'}
        </p>
      )}
      <div className="report-doc-header-brand">
        <div className="report-doc-brand-text">
          <p className="report-doc-brand-name">{BRAND_NAME.toUpperCase()}</p>
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
        {showAnalysed && (
          <div>
            <dt>Analysed website</dt>
            <dd className="report-doc-url">{analysedValue}</dd>
          </div>
        )}
      </dl>
    </header>
  )
}
