import fs from 'fs'
import path from 'path'
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
} from '@/lib/report/presentation'
import { LOGO_STACKED_DARK_HEADER_TRIMMED_SRC } from '@/lib/brand/assets'

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

function logoDataUri(): string | null {
  try {
    const relative = LOGO_STACKED_DARK_HEADER_TRIMMED_SRC.replace(/^\//, '')
    const filePath = path.join(process.cwd(), 'public', relative)
    const buf = fs.readFileSync(filePath)
    return `data:image/png;base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

export interface PDFReportData {
  websiteUrl: string
  reportType: 'snapshot' | 'detailed'
  sections: Record<string, unknown>
  reportVersion?: 2 | 3
}

function renderBodyHtml(content: string): string {
  return splitReportContent(content)
    .map(block => {
      if (block.type === 'stage') {
        return `<div class="stage"><div class="stage-label">${escapeHtml(block.label)}</div>${
          block.text ? `<p>${escapeHtml(block.text)}</p>` : ''
        }</div>`
      }
      if (block.type === 'priority') {
        return `<div class="priority"><div class="priority-label">Priority ${block.index}</div><p>${escapeHtml(block.text)}</p></div>`
      }
      return `<p>${escapeHtml(block.text)}</p>`
    })
    .join('')
}

export function buildPDFHTML(data: PDFReportData): string {
  const date = formatReportDate()
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
  const logo = logoDataUri()
  const year = new Date().getFullYear()

  const sectionsHTML = iterableSectionEntries(data.sections)
    .map(([key, value], index) => {
      const label = getSectionLabel(key, type, version)
      const number = formatSectionNumber(index)
      const emphasized = isEmphasizedSection(key, type, version)
      return `
        <section class="section${emphasized ? ' section-emphasis' : ''}">
          <div class="section-head">
            <div class="section-number">${escapeHtml(number)}</div>
            <div>
              <div class="section-category">${escapeHtml(label.category)}</div>
              <h2 class="section-title">${escapeHtml(label.title)}</h2>
            </div>
          </div>
          <div class="section-body">${renderBodyHtml(value)}</div>
        </section>
      `
    })
    .join('')

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
    color: #0A0F1C;
    padding: 36px 42px 48px;
    max-width: 820px;
    margin: 0 auto;
    font-size: 13.5px;
    line-height: 1.65;
  }
  .cover {
    border: 1px solid #E5EBF3;
    border-radius: 10px;
    padding: 22px 22px 20px;
    margin-bottom: 22px;
    background: linear-gradient(180deg, #ffffff 0%, #f7f9fd 100%);
  }
  .brand-row {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;
  }
  .logo {
    height: 54px;
    width: auto;
    object-fit: contain;
  }
  .brand-name {
    font-size: 14px;
    font-weight: 700;
    color: #08112A;
  }
  .tagline {
    margin-top: 3px;
    font-size: 10px;
    letter-spacing: 0.06em;
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
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.25;
    margin-bottom: 14px;
    color: #08112A;
  }
  .meta {
    display: grid;
    grid-template-columns: 1fr 1fr 1.4fr;
    gap: 12px;
  }
  .meta dt {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6B7280;
    margin-bottom: 3px;
  }
  .meta dd {
    font-size: 12.5px;
    font-weight: 600;
    color: #1F2A3C;
    word-break: break-word;
  }
  .section {
    margin-bottom: 14px;
    padding: 14px 14px 14px 16px;
    border: 1px solid #E5EBF3;
    border-left: 3px solid #c9d5ea;
    border-radius: 8px;
    page-break-inside: avoid;
  }
  .section-emphasis { border-left-color: #2E6BFF; background: #f8fbff; }
  .section-head { display:flex; gap:12px; margin-bottom:10px; }
  .section-number {
    font-size: 13px;
    font-weight: 800;
    color: #1F52D9;
    min-width: 24px;
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
    font-size: 14.5px;
    font-weight: 700;
    color: #08112A;
  }
  .section-body p {
    font-size: 12.5px;
    color: #1F2A3C;
    line-height: 1.7;
    margin-bottom: 8px;
    white-space: pre-wrap;
  }
  .section-body p:last-child { margin-bottom: 0; }
  .priority, .stage {
    border: 1px solid #E5EBF3;
    background: #f8fafc;
    border-radius: 7px;
    padding: 9px 10px;
    margin-bottom: 8px;
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
    margin-top: 22px;
    padding: 18px 16px;
    border-radius: 10px;
    background: #0D1A36;
    color: #fff;
    text-align: center;
    page-break-inside: avoid;
  }
  .cta h3 {
    font-size: 16px;
    margin-bottom: 8px;
  }
  .cta p {
    font-size: 12.5px;
    color: rgba(255,255,255,0.82);
    margin-bottom: 12px;
  }
  .cta a.button {
    display: inline-block;
    background: #2E6BFF;
    color: #fff !important;
    text-decoration: none;
    font-weight: 700;
    font-size: 12.5px;
    padding: 10px 16px;
    border-radius: 8px;
  }
  .footer {
    margin-top: 24px;
    padding-top: 14px;
    border-top: 1px solid #E5EBF3;
    text-align: center;
    font-size: 11px;
    color: #6B7280;
  }
  .footer a { color: #1F52D9; text-decoration: none; }
  .footer .links { margin: 6px 0; }
  @media print {
    body { padding: 18px; }
    .section { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <header class="cover">
    <div class="brand-row">
      ${logo ? `<img class="logo" src="${logo}" alt="${escapeHtml(BRAND_NAME)}" />` : ''}
      <div>
        <div class="brand-name">${escapeHtml(BRAND_NAME)}</div>
        <div class="tagline">${escapeHtml(REPORT_TAGLINE)}</div>
      </div>
      <div class="badge">${escapeHtml(type)}</div>
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
    <h3>Need help implementing this plan?</h3>
    <p>${escapeHtml(BRAND_NAME)} can help turn the findings into a practical search, content and website improvement plan.</p>
    <a class="button" href="${escapeHtml(REPORT_CONTACT.contactUrl)}">Contact ${escapeHtml(BRAND_NAME)}</a>
  </section>

  <footer class="footer">
    <div><strong>${escapeHtml(BRAND_NAME)}</strong> · Search &amp; Business Growth Reports</div>
    <div class="links">
      <a href="${escapeHtml(REPORT_CONTACT.homeUrl)}">thinkbigdigital.co</a>
      ·
      <a href="${escapeHtml(REPORT_CONTACT.contactUrl)}">Contact Think Big Digital</a>
      ·
      <a href="${escapeHtml(REPORT_CONTACT.emailHref)}">${escapeHtml(REPORT_CONTACT.emailDisplay)}</a>
    </div>
    <div>${escapeHtml(REPORT_CONTACT.seoToolUrl)} · © ${year}</div>
  </footer>
</body>
</html>`
}
