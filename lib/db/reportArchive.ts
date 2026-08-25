import { dbQuery } from './client'
import { buildPDFBuffer, reportPDFFilename } from '@/lib/pdf/generateBinaryPDF'

let schemaPromise: Promise<void> | null = null

export async function ensureReportArchiveSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await dbQuery(`
        ALTER TABLE reports
        ADD COLUMN IF NOT EXISTS pdf_base64 TEXT
      `)
      await dbQuery(`
        ALTER TABLE reports
        ADD COLUMN IF NOT EXISTS pdf_filename TEXT
      `)
      await dbQuery(`
        ALTER TABLE reports
        ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMP WITH TIME ZONE
      `)
      await dbQuery(`
        CREATE INDEX IF NOT EXISTS idx_reports_type_created_at
        ON reports (report_type, created_at DESC)
      `)
    })().catch(err => {
      schemaPromise = null
      throw err
    })
  }

  return schemaPromise
}

export async function insertArchivedReport({
  websiteUrl,
  reportType,
  email,
  status,
  sectionsJson,
}: {
  websiteUrl: string
  reportType: string
  email?: string
  status: string
  sectionsJson: object
}) {
  await ensureReportArchiveSchema()

  let pdfBase64: string | null = null
  let pdfFilename: string | null = null
  let pdfGeneratedAt: string | null = null

  try {
    const pdf = buildPDFBuffer({ websiteUrl, reportType, sections: sectionsJson })
    pdfBase64 = pdf.toString('base64')
    pdfFilename = reportPDFFilename(websiteUrl, reportType)
    pdfGeneratedAt = new Date().toISOString()
  } catch (err) {
    console.error('[Report Archive] PDF generation failed:', err)
  }

  const rows = await dbQuery(
    `INSERT INTO reports
      (website_url, report_type, email, status, sections_json, pdf_base64, pdf_filename, pdf_generated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      websiteUrl,
      reportType,
      email?.toLowerCase().trim() || null,
      status,
      JSON.stringify(sectionsJson),
      pdfBase64,
      pdfFilename,
      pdfGeneratedAt,
    ]
  )

  return rows[0]?.id || null
}

export async function ensureReportPDF(reportId: string) {
  await ensureReportArchiveSchema()

  const rows = await dbQuery(
    `SELECT id, website_url, report_type, sections_json, pdf_base64, pdf_filename
     FROM reports
     WHERE id = $1
     LIMIT 1`,
    [reportId]
  )

  if (!rows.length) return null
  const report = rows[0]

  if (report.pdf_base64) {
    return {
      bytes: Buffer.from(report.pdf_base64, 'base64'),
      filename: report.pdf_filename || reportPDFFilename(report.website_url, report.report_type),
    }
  }

  const sections = report.sections_json || {}
  const pdf = buildPDFBuffer({
    websiteUrl: report.website_url,
    reportType: report.report_type,
    sections,
  })
  const filename = reportPDFFilename(report.website_url, report.report_type)
  const base64 = pdf.toString('base64')

  await dbQuery(
    `UPDATE reports
     SET pdf_base64 = $1,
         pdf_filename = $2,
         pdf_generated_at = NOW()
     WHERE id = $3`,
    [base64, filename, reportId]
  )

  return { bytes: pdf, filename }
}
