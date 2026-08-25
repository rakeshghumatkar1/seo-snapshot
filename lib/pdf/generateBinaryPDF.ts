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
  reportDocumentTitle,
  splitReportContent,
} from '@/lib/report/presentation'

type PDFLine = {
  text: string
  size: number
  leading: number
  bold?: boolean
  link?: string
}

type ReportSections = Record<string, unknown>

function asciiText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2022/g, '-')
    .replace(/[^\x20-\x7E\n]/g, '')
}

function escapePDFText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function wrapText(value: string, maxChars: number): string[] {
  const clean = asciiText(value).replace(/\r/g, '')
  const paragraphs = clean.split('\n')
  const lines: string[] = []

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean)
    if (!words.length) {
      lines.push('')
      continue
    }

    let line = ''
    for (const word of words) {
      if (!line) {
        line = word
      } else if (`${line} ${word}`.length <= maxChars) {
        line += ` ${word}`
      } else {
        lines.push(line)
        line = word
      }
    }
    if (line) lines.push(line)
  }

  return lines
}

function buildLines({
  websiteUrl,
  reportType,
  sections,
}: {
  websiteUrl: string
  reportType: string
  sections: ReportSections
}): PDFLine[] {
  const generated = formatReportDate()
  const type = reportType === 'detailed' ? 'detailed' : 'snapshot'
  const version = detectReportVersion(sections)
  const heading = reportDocumentTitle(type)
  const domain = displayDomain(websiteUrl)

  const lines: PDFLine[] = [
    { text: BRAND_NAME, size: 12, leading: 16, bold: true },
    { text: REPORT_TAGLINE, size: 8, leading: 12 },
    { text: '', size: 8, leading: 8 },
    { text: heading, size: 16, leading: 20, bold: true },
    { text: '', size: 8, leading: 8 },
    { text: `Prepared for: ${asciiText(domain)}`, size: 10, leading: 14 },
    { text: `Analysed website: ${asciiText(websiteUrl)}`, size: 9, leading: 13 },
    { text: `Generated: ${generated}`, size: 9, leading: 13 },
    { text: '', size: 9, leading: 12 },
  ]

  iterableSectionEntries(sections || {}).forEach(([key, value], index) => {
    const label = getSectionLabel(key, type, version)
    const number = formatSectionNumber(index)
    lines.push({
      text: `${number}  ${asciiText(label.category)}`,
      size: 9,
      leading: 13,
      bold: true,
    })
    lines.push({
      text: asciiText(label.title),
      size: 12,
      leading: 16,
      bold: true,
    })

    for (const block of splitReportContent(String(value))) {
      if (block.type === 'stage') {
        lines.push({
          text: asciiText(block.label),
          size: 9,
          leading: 13,
          bold: true,
        })
        if (block.text) {
          for (const bodyLine of wrapText(block.text, 92)) {
            lines.push({ text: bodyLine, size: 9, leading: 12 })
          }
        }
      } else if (block.type === 'priority') {
        lines.push({
          text: `Priority ${block.index}`,
          size: 9,
          leading: 13,
          bold: true,
        })
        for (const bodyLine of wrapText(block.text, 92)) {
          lines.push({ text: bodyLine, size: 9, leading: 12 })
        }
      } else {
        for (const bodyLine of wrapText(block.text, 92)) {
          lines.push({ text: bodyLine, size: 9, leading: 12 })
        }
      }
    }

    lines.push({ text: '', size: 9, leading: 12 })
  })

  lines.push({ text: '', size: 9, leading: 10 })
  lines.push({
    text: 'Need help implementing this plan?',
    size: 12,
    leading: 16,
    bold: true,
  })
  lines.push({
    text: `${BRAND_NAME} can help turn these findings into a practical improvement plan.`,
    size: 9,
    leading: 13,
  })
  lines.push({
    text: `Contact ${BRAND_NAME}`,
    size: 10,
    leading: 14,
    bold: true,
    link: REPORT_CONTACT.contactUrl,
  })
  lines.push({
    text: asciiText(REPORT_CONTACT.homeUrl),
    size: 9,
    leading: 12,
    link: REPORT_CONTACT.homeUrl,
  })
  lines.push({
    text: asciiText(REPORT_CONTACT.emailDisplay),
    size: 9,
    leading: 12,
    link: REPORT_CONTACT.emailHref.split('?')[0],
  })

  return lines
}

function splitPages(lines: PDFLine[]): PDFLine[][] {
  const pages: PDFLine[][] = []
  let page: PDFLine[] = []
  let used = 0
  const usableHeight = 640

  for (const line of lines) {
    if (page.length && used + line.leading > usableHeight) {
      pages.push(page)
      page = []
      used = 0
    }
    page.push(line)
    used += line.leading
  }

  if (page.length) pages.push(page)
  return pages.length
    ? pages
    : [[{ text: `${BRAND_NAME} Report`, size: 16, leading: 20, bold: true }]]
}

function pageContent(
  lines: PDFLine[],
  pageIndex: number,
  pageCount: number
): { stream: string; links: Array<{ y: number; text: string; url: string }> } {
  let y = 742
  const chunks: string[] = ['BT']
  const links: Array<{ y: number; text: string; url: string }> = []

  for (const line of lines) {
    const font = line.bold ? '/F2' : '/F1'
    chunks.push(`${font} ${line.size} Tf`)
    chunks.push(`1 0 0 1 50 ${y} Tm`)
    chunks.push(`(${escapePDFText(line.text)}) Tj`)
    if (line.link) {
      links.push({ y, text: line.text, url: line.link })
    }
    y -= line.leading
  }

  chunks.push('ET')

  // Footer line
  const footerY = 36
  chunks.push('BT')
  chunks.push('/F1 8 Tf')
  chunks.push(`1 0 0 1 50 ${footerY} Tm`)
  chunks.push(
    `(${escapePDFText(`${BRAND_NAME}  |  ${REPORT_CONTACT.seoToolUrl.replace(/^https?:\/\//, '')}  |  Contact Think Big Digital  |  ${pageIndex + 1}/${pageCount}`)}) Tj`
  )
  chunks.push('ET')
  links.push({
    y: footerY,
    text: 'Contact Think Big Digital',
    url: REPORT_CONTACT.contactUrl,
  })

  return { stream: chunks.join('\n'), links }
}

function linkAnnot(y: number, text: string, url: string): string {
  const width = Math.min(500, Math.max(120, text.length * 5))
  const x1 = 48
  const x2 = 48 + width
  const y1 = y - 2
  const y2 = y + 11
  return `<< /Type /Annot /Subtype /Link /Rect [${x1} ${y1} ${x2} ${y2}] /Border [0 0 0] /A << /S /URI /URI (${escapePDFText(url)}) >> >>`
}

export function buildPDFBuffer(data: {
  websiteUrl: string
  reportType: string
  sections: ReportSections
}): Buffer {
  // Legacy V2 coordinate PDF only. New V3 reports use buildCanonicalReportPdf.
  const pages = splitPages(buildLines(data))
  const objects: string[] = []

  // Reserve object ids:
  // 1 Catalog, 2 Pages, 3 Helvetica, 4 Helvetica-Bold
  // then pairs of content+page for each page, then annotations inline in pages
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'

  const pageIds: number[] = []
  let nextId = 5

  pages.forEach((lines, index) => {
    const { stream, links } = pageContent(lines, index, pages.length)
    const contentId = nextId++
    const pageId = nextId++
    pageIds.push(pageId)

    const annotIds: number[] = []
    for (const link of links) {
      const annotId = nextId++
      objects[annotId] = linkAnnot(link.y, link.text, link.url)
      annotIds.push(annotId)
    }

    const length = Buffer.byteLength(stream, 'utf8')
    objects[contentId] = `<< /Length ${length} >>\nstream\n${stream}\nendstream`
    const annots =
      annotIds.length > 0
        ? ` /Annots [${annotIds.map(id => `${id} 0 R`).join(' ')}]`
        : ''
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R${annots} >>`
  })

  objects[2] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`

  let pdf = '%PDF-1.4\n%ThinkBig\n'
  const offsets: number[] = [0]
  const maxId = nextId - 1

  for (let id = 1; id <= maxId; id++) {
    offsets[id] = Buffer.byteLength(pdf, 'utf8')
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${maxId + 1}\n`
  pdf += '0000000000 65535 f \n'

  for (let id = 1; id <= maxId; id++) {
    pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  return Buffer.from(pdf, 'utf8')
}

export function reportPDFFilename(websiteUrl: string, reportType: string): string {
  const domain = websiteUrl
    .replace(/^https?:\/\//i, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

  return `seo-${reportType || 'report'}-${domain || 'website'}.pdf`
}
