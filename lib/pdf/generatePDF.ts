import { detectReportVersion } from '@/types/report'
import {
  getSectionLabel,
  iterableSectionEntries,
} from '@/lib/report/sectionLabels'

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

export interface PDFReportData {
  websiteUrl: string
  reportType: 'snapshot' | 'detailed'
  sections: Record<string, unknown>
  reportVersion?: 2 | 3
}

function reportTitle(reportType: 'snapshot' | 'detailed'): string {
  return reportType === 'detailed'
    ? 'Search & Business Growth Detailed Report'
    : 'Search & Business Growth Snapshot'
}

export function buildPDFHTML(data: PDFReportData): string {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const version = detectReportVersion(
    data.sections,
    data.reportVersion ??
      (typeof data.sections.reportVersion === 'number'
        ? (data.sections.reportVersion as 2 | 3)
        : undefined)
  )

  const sectionsHTML = iterableSectionEntries(data.sections)
    .map(([key, value]) => {
      const label = getSectionLabel(key, data.reportType, version)
      return `
        <div class="section">
          <div class="section-category">${escapeHtml(label.category)}</div>
          <h3 class="section-title">${escapeHtml(label.title)}</h3>
          <p class="section-body">${escapeHtml(value)}</p>
        </div>
      `
    })
    .join('')

  const title = reportTitle(data.reportType)

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)} — ${escapeHtml(data.websiteUrl)}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #fff;
    color: #0a0a14;
    padding: 48px;
    max-width: 800px;
    margin: 0 auto;
    font-size: 14px;
    line-height: 1.6;
  }
  .header {
    padding-bottom: 24px;
    margin-bottom: 32px;
    border-bottom: 3px solid #10b981;
  }
  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  .logo {
    font-size: 22px;
    font-weight: 800;
    color: #0a0a14;
    letter-spacing: -0.02em;
  }
  .logo span { color: #10b981; }
  .report-badge {
    background: #ecfdf5;
    border: 1px solid #10b981;
    color: #065f46;
    padding: 5px 14px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .website-url {
    font-size: 24px;
    font-weight: 800;
    color: #0a0a14;
    letter-spacing: -0.02em;
    margin-bottom: 6px;
  }
  .report-meta {
    font-size: 13px;
    color: #6b7280;
  }
  .section {
    margin-bottom: 24px;
    padding: 20px 20px 20px 24px;
    border: 1px solid #e5e7eb;
    border-left: 3px solid #10b981;
    border-radius: 8px;
    page-break-inside: avoid;
  }
  .section-category {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #9ca3af;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .section-title {
    font-size: 15px;
    font-weight: 700;
    color: #0a0a14;
    margin-bottom: 10px;
  }
  .section-body {
    font-size: 13px;
    color: #374151;
    line-height: 1.75;
    white-space: pre-wrap;
  }
  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
    text-align: center;
    font-size: 12px;
    color: #9ca3af;
  }
  @media print {
    body { padding: 24px; }
    .section { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="header">
    <div class="header-top">
      <div class="logo">SEO<span>&bull;</span>Snapshot</div>
      <div class="report-badge">${escapeHtml(data.reportType.toUpperCase())}</div>
    </div>
    <div class="website-url">${escapeHtml(data.websiteUrl)}</div>
    <div class="report-meta">Generated on ${escapeHtml(date)} &middot; ${escapeHtml(title)}</div>
  </div>
  ${sectionsHTML}
  <div class="footer">Search &amp; Business Growth Report &middot; ${escapeHtml(data.websiteUrl)} &middot; ${escapeHtml(date)}</div>
</body>
</html>`
}
