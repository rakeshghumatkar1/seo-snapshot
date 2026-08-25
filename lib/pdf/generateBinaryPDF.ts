import { detectReportVersion } from '@/types/report'
import {
  getSectionLabel,
  iterableSectionEntries,
} from '@/lib/report/sectionLabels'

type PDFLine = {
  text: string
  size: number
  leading: number
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
  const generated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const type = reportType === 'detailed' ? 'detailed' : 'snapshot'
  const version = detectReportVersion(sections)
  const heading =
    type === 'detailed'
      ? 'Search & Business Growth Detailed Report'
      : 'Search & Business Growth Snapshot'

  const lines: PDFLine[] = [
    { text: heading, size: 16, leading: 22 },
    { text: asciiText(websiteUrl), size: 14, leading: 20 },
    { text: `${asciiText(type).toUpperCase()} - Generated ${generated}`, size: 9, leading: 18 },
    { text: '', size: 9, leading: 10 },
  ]

  for (const [key, value] of iterableSectionEntries(sections || {})) {
    const label = getSectionLabel(key, type, version)
    lines.push({ text: asciiText(`${label.category}: ${label.title}`), size: 12, leading: 17 })
    for (const bodyLine of wrapText(String(value), 92)) {
      lines.push({ text: bodyLine, size: 9, leading: 13 })
    }
    lines.push({ text: '', size: 9, leading: 10 })
  }

  lines.push({
    text: `Search & Business Growth Report - ${asciiText(websiteUrl)}`,
    size: 8,
    leading: 10,
  })
  return lines
}

function splitPages(lines: PDFLine[]): PDFLine[][] {
  const pages: PDFLine[][] = []
  let page: PDFLine[] = []
  let used = 0
  const usableHeight = 660

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
  return pages.length ? pages : [[{ text: 'SEO AI Report', size: 16, leading: 20 }]]
}

function pageStream(lines: PDFLine[]): string {
  let y = 742
  const chunks: string[] = ['BT']

  for (const line of lines) {
    chunks.push(`/F1 ${line.size} Tf`)
    chunks.push(`1 0 0 1 50 ${y} Tm`)
    chunks.push(`(${escapePDFText(line.text)}) Tj`)
    y -= line.leading
  }

  chunks.push('ET')
  return chunks.join('\n')
}

export function buildPDFBuffer(data: {
  websiteUrl: string
  reportType: string
  sections: ReportSections
}): Buffer {
  const pages = splitPages(buildLines(data))
  const objects: string[] = []

  const pageIds = pages.map((_, index) => 5 + index * 2)
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'

  pages.forEach((lines, index) => {
    const contentId = 4 + index * 2
    const pageId = 5 + index * 2
    const stream = pageStream(lines)
    const length = Buffer.byteLength(stream, 'utf8')

    objects[contentId] = `<< /Length ${length} >>\nstream\n${stream}\nendstream`
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`
  })

  let pdf = '%PDF-1.4\n%SEOAI\n'
  const offsets: number[] = [0]
  const maxId = 3 + pages.length * 2

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
