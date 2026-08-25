import { detectReportVersion } from '@/types/report'
import {
  getSectionLabel,
  iterableSectionEntries,
} from '@/lib/report/sectionLabels'
import {
  BRAND_NAME,
  REPORT_CONTACT,
  REPORT_TAGLINE,
  displayDomain,
  formatReportDate,
  formatSectionNumber,
  isEmphasizedSection,
  reportDocumentTitle,
  splitReportContent,
  type ContentBlock,
} from '@/lib/report/presentation'

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
  generatedAt?: Date | string
}

function renderBlock(block: ContentBlock): string {
  if (block.type === 'stage') {
    return `<div class="stage"><div class="stage-label">${escapeHtml(block.label)}</div>${
      block.text ? `<p>${escapeHtml(block.text)}</p>` : ''
    }</div>`
  }
  if (block.type === 'priority') {
    return `<div class="priority"><div class="priority-label">Priority ${block.index}</div><p>${escapeHtml(block.text)}</p></div>`
  }
  return `<p>${escapeHtml(block.text)}</p>`
}

function renderSectionBody(content: string): { keepWithHeading: string; rest: string } {
  const blocks = splitReportContent(content)
  if (!blocks.length) return { keepWithHeading: '', rest: '' }

  const [first, ...rest] = blocks
  return {
    keepWithHeading: renderBlock(first),
    rest: rest.map(renderBlock).join(''),
  }
}

export function reportPDFFilename(websiteUrl: string, reportType: string): string {
  const domain = websiteUrl
    .replace(/^https?:\/\//i, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

  return `seo-${reportType || 'report'}-${domain || 'website'}.pdf`
}

/** Shared branded report HTML used for print/PDF (and visual parity with the web report). */
export function buildPDFHTML(data: PDFReportData): string {
  const generatedAt =
    data.generatedAt instanceof Date
      ? data.generatedAt
      : data.generatedAt
        ? new Date(data.generatedAt)
        : new Date()
  const date = formatReportDate(generatedAt)
  const type = data.reportType === 'detailed' ? 'detailed' : 'snapshot'
  const version = detectReportVersion(
    data.sections,
    data.reportVersion ??
      (typeof data.sections.reportVersion === 'number'
        ? (data.sections.reportVersion as 2 | 3)
        : undefined)
  )
  const title = reportDocumentTitle(type)
  const domain = displayDomain(data.websiteUrl)
  const year = generatedAt.getFullYear()

  const sectionsHTML = iterableSectionEntries(data.sections)
    .map(([key, value], index) => {
      const label = getSectionLabel(key, type, version)
      const number = formatSectionNumber(index)
      const emphasized = isEmphasizedSection(key, type, version)
      const body = renderSectionBody(value)
      return `
        <section class="section${emphasized ? ' section-emphasis' : ''}">
          <div class="section-keep">
            <div class="section-head">
              <div class="section-number">${escapeHtml(number)}</div>
              <div>
                <div class="section-category">${escapeHtml(label.category)}</div>
                <h2 class="section-title">${escapeHtml(label.title)}</h2>
              </div>
            </div>
            <div class="section-body">${body.keepWithHeading}</div>
          </div>
          ${body.rest ? `<div class="section-body section-body-continued">${body.rest}</div>` : ''}
        </section>
      `
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)} — ${escapeHtml(data.websiteUrl)}</title>
<style>
  @page {
    size: A4;
    margin: 14mm 12mm 16mm;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    background: #fff;
    color: #0A0F1C;
    font-size: 12.5px;
    line-height: 1.65;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cover {
    border: 1px solid #E5EBF3;
    border-radius: 10px;
    padding: 18px 18px 16px;
    margin-bottom: 16px;
    background: linear-gradient(180deg, #ffffff 0%, #f7f9fd 100%);
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .brand-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  .brand-name {
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: #08112A;
    text-transform: uppercase;
  }
  .tagline {
    margin-top: 3px;
    font-size: 10px;
    letter-spacing: 0.04em;
    color: #6B7280;
  }
  .badge {
    margin-left: auto;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #163EA8;
    border: 1px solid rgba(46,107,255,0.28);
    background: rgba(46,107,255,0.06);
    border-radius: 999px;
    padding: 5px 10px;
  }
  .doc-title {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.25;
    margin-bottom: 12px;
    color: #08112A;
  }
  .meta {
    display: grid;
    grid-template-columns: 1fr 1fr 1.35fr;
    gap: 10px;
  }
  .meta dt {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6B7280;
    margin-bottom: 2px;
  }
  .meta dd {
    font-size: 12px;
    font-weight: 600;
    color: #1F2A3C;
    word-break: break-word;
  }
  .section {
    margin-bottom: 11px;
    padding: 12px 12px 12px 14px;
    border: 1px solid #E5EBF3;
    border-left: 3px solid #c9d5ea;
    border-radius: 8px;
    background: #fff;
  }
  .section-emphasis {
    border-left-color: #2E6BFF;
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  }
  .section-keep {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .section-head {
    display:flex;
    gap:10px;
    margin-bottom:8px;
    break-after: avoid;
    page-break-after: avoid;
  }
  .section-number {
    font-size: 12px;
    font-weight: 800;
    color: #1F52D9;
    min-width: 22px;
  }
  .section-category {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #6B7280;
    margin-bottom: 2px;
  }
  .section-title {
    font-size: 13.5px;
    font-weight: 700;
    color: #08112A;
  }
  .section-body p {
    font-size: 12px;
    color: #1F2A3C;
    line-height: 1.65;
    margin-bottom: 7px;
    white-space: pre-wrap;
  }
  .section-body p:last-child { margin-bottom: 0; }
  .section-lead {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .section-body-continued {
    margin-top: 7px;
  }
  .priority, .stage {
    border: 1px solid #E5EBF3;
    background: #f8fafc;
    border-radius: 7px;
    padding: 8px 9px;
    margin-bottom: 7px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .section-emphasis .priority,
  .section-emphasis .stage {
    border-color: rgba(46,107,255,0.18);
    background: #f3f7ff;
  }
  .priority-label, .stage-label {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #163EA8;
    margin-bottom: 3px;
  }
  .cta {
    margin-top: 16px;
    padding: 16px 14px;
    border-radius: 10px;
    background: #0D1A36;
    color: #fff;
    text-align: center;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .cta .kicker {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.7);
    margin-bottom: 6px;
  }
  .cta h3 {
    font-size: 15px;
    margin-bottom: 7px;
  }
  .cta p {
    font-size: 12px;
    color: rgba(255,255,255,0.82);
    margin-bottom: 11px;
  }
  .cta a.button {
    display: inline-block;
    background: #2E6BFF;
    color: #fff !important;
    text-decoration: none;
    font-weight: 700;
    font-size: 12px;
    padding: 9px 14px;
    border-radius: 8px;
  }
  .cta .meta-links {
    margin-top: 10px;
    font-size: 11px;
    color: rgba(255,255,255,0.78);
  }
  .cta .meta-links a { color: #93c5fd; text-decoration: none; }
  .footer {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #E5EBF3;
    text-align: center;
    font-size: 10.5px;
    color: #6B7280;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .footer .name {
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #08112A;
    margin-bottom: 2px;
  }
  .footer a { color: #1F52D9; text-decoration: none; }
  .footer .links { margin: 5px 0; }
</style>
</head>
<body>
  <header class="cover">
    <div class="brand-row">
      <div>
        <div class="brand-name">${escapeHtml(BRAND_NAME.toUpperCase())}</div>
        <div class="tagline">${escapeHtml(REPORT_TAGLINE)}</div>
      </div>
      <div class="badge">${escapeHtml(type === 'detailed' ? 'Detailed' : 'Snapshot')}</div>
    </div>
    <h1 class="doc-title">${escapeHtml(title)}</h1>
    <dl class="meta">
      <div><dt>Prepared for</dt><dd>${escapeHtml(domain)}</dd></div>
      <div><dt>Generated</dt><dd>${escapeHtml(date)}</dd></div>
      <div><dt>Analysed website</dt><dd>${escapeHtml(data.websiteUrl)}</dd></div>
    </dl>
  </header>

  ${sectionsHTML}

  <section class="cta">
    <div class="kicker">${escapeHtml(BRAND_NAME)}</div>
    <h3>Need help implementing these recommendations?</h3>
    <p>${escapeHtml(BRAND_NAME)} can help turn the findings into a practical search, content and website improvement plan.</p>
    <a class="button" href="${escapeHtml(REPORT_CONTACT.contactUrl)}">Contact ${escapeHtml(BRAND_NAME)}</a>
    <div class="meta-links">
      <a href="${escapeHtml(REPORT_CONTACT.homeUrl)}">thinkbigdigital.co</a>
      &nbsp;|&nbsp;
      <a href="${escapeHtml(REPORT_CONTACT.emailHref)}">${escapeHtml(REPORT_CONTACT.emailDisplay)}</a>
      &nbsp;|&nbsp;
      <a href="${escapeHtml(REPORT_CONTACT.phoneHref)}">${escapeHtml(REPORT_CONTACT.phoneDisplay)}</a>
    </div>
  </section>

  <footer class="footer">
    <div class="name">${escapeHtml(BRAND_NAME.toUpperCase())}</div>
    <div>Search &amp; Business Growth Reports</div>
    <div class="links">
      <a href="${escapeHtml(REPORT_CONTACT.homeUrl)}">thinkbigdigital.co</a>
      &nbsp;|&nbsp;
      <a href="${escapeHtml(REPORT_CONTACT.contactUrl)}">Contact Think Big Digital</a>
      &nbsp;|&nbsp;
      <a href="${escapeHtml(REPORT_CONTACT.emailHref)}">${escapeHtml(REPORT_CONTACT.emailDisplay)}</a>
    </div>
    <div>© ${year} ${escapeHtml(BRAND_NAME)}</div>
  </footer>
</body>
</html>`
}
