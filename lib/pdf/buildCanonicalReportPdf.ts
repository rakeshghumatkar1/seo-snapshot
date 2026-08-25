import { buildPDFHTML, reportPDFFilename, type PDFReportData } from './generatePDF'
import { renderHtmlToPdf } from './renderHtmlToPdf'

export { reportPDFFilename }

/** Canonical branded PDF for new reports — HTML presentation rendered to PDF bytes. */
export async function buildCanonicalReportPdf(data: PDFReportData): Promise<{
  bytes: Buffer
  filename: string
  html: string
}> {
  const html = buildPDFHTML(data)
  const bytes = await renderHtmlToPdf(html)
  return {
    bytes,
    filename: reportPDFFilename(data.websiteUrl, data.reportType),
    html,
  }
}
