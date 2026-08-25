import {
  BRAND_NAME,
  REPORT_CONTACT,
} from '@/lib/report/presentation'

export default function ReportFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="report-doc-footer" aria-label="Report branding">
      <div className="report-doc-footer-brand">
        <p className="report-doc-footer-name">{BRAND_NAME}</p>
        <p className="report-doc-footer-sub">Search &amp; Business Growth Reports</p>
      </div>
      <div className="report-doc-footer-links">
        <a href={REPORT_CONTACT.homeUrl} target="_blank" rel="noopener noreferrer">
          thinkbigdigital.co
        </a>
        <span aria-hidden="true">·</span>
        <a href={REPORT_CONTACT.contactUrl} target="_blank" rel="noopener noreferrer">
          Contact
        </a>
        <span aria-hidden="true">·</span>
        <a href={REPORT_CONTACT.emailHref}>{REPORT_CONTACT.emailDisplay}</a>
      </div>
      <p className="report-doc-footer-copy">© {year} {BRAND_NAME}</p>
    </footer>
  )
}
