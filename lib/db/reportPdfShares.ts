import { randomBytes } from 'crypto'
import { dbQuery } from '@/lib/db/client'

let schemaPromise: Promise<void> | null = null

export async function ensureReportPdfSharesSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await dbQuery(`
        CREATE TABLE IF NOT EXISTS report_pdf_shares (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
          share_token TEXT NOT NULL UNIQUE,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          revoked_at TIMESTAMPTZ NULL,
          last_accessed_at TIMESTAMPTZ NULL,
          access_count INTEGER NOT NULL DEFAULT 0
        )
      `)
      await dbQuery(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_report_pdf_shares_one_active
        ON report_pdf_shares (report_id)
        WHERE is_active = TRUE AND revoked_at IS NULL
      `)
      await dbQuery(`
        CREATE INDEX IF NOT EXISTS idx_report_pdf_shares_token_active
        ON report_pdf_shares (share_token)
        WHERE is_active = TRUE AND revoked_at IS NULL
      `)
    })().catch((err) => {
      schemaPromise = null
      throw err
    })
  }
  return schemaPromise
}

/** Cryptographically strong URL token (256-bit). */
export function generatePdfShareToken(): string {
  return randomBytes(32).toString('base64url')
}

export type PdfShareRow = {
  id: string
  report_id: string
  share_token: string
  is_active: boolean
  created_at: string
  updated_at: string
  revoked_at: string | null
  last_accessed_at: string | null
  access_count: number
}

export async function getActiveShareForReport(
  reportId: string
): Promise<PdfShareRow | null> {
  await ensureReportPdfSharesSchema()
  const rows = await dbQuery(
    `SELECT *
     FROM report_pdf_shares
     WHERE report_id = $1::uuid
       AND is_active = TRUE
       AND revoked_at IS NULL
     LIMIT 1`,
    [reportId]
  )
  return (rows[0] as PdfShareRow) || null
}

export async function getActiveShareByToken(
  token: string
): Promise<PdfShareRow | null> {
  await ensureReportPdfSharesSchema()
  const rows = await dbQuery(
    `SELECT *
     FROM report_pdf_shares
     WHERE share_token = $1
     LIMIT 1`,
    [token]
  )
  const row = (rows[0] as PdfShareRow) || null
  if (!row) return null
  // Explicit JS checks — avoid boolean/NULL quirks on filtered SQL alone
  if (row.is_active !== true) return null
  if (row.revoked_at) return null
  return row
}

/**
 * Create or reuse the single active share link for a report.
 * Requires the report to already have stored pdf_base64.
 */
export async function createOrGetPdfShare(
  reportId: string
): Promise<{ share: PdfShareRow; created: boolean } | { error: string }> {
  await ensureReportPdfSharesSchema()

  const reports = await dbQuery(
    `SELECT id, (pdf_base64 IS NOT NULL) AS has_pdf
     FROM reports
     WHERE id = $1::uuid
     LIMIT 1`,
    [reportId]
  )
  if (!reports.length) return { error: 'Report not found' }
  if (!reports[0].has_pdf) {
    return { error: 'PDF is not stored yet. Open/create the PDF first.' }
  }

  const existing = await getActiveShareForReport(reportId)
  if (existing) return { share: existing, created: false }

  const token = generatePdfShareToken()
  try {
    const rows = await dbQuery(
      `INSERT INTO report_pdf_shares (report_id, share_token, is_active)
       VALUES ($1::uuid, $2, TRUE)
       RETURNING *`,
      [reportId, token]
    )
    return { share: rows[0] as PdfShareRow, created: true }
  } catch (err: any) {
    // Race: another create won the unique active index — return existing
    const again = await getActiveShareForReport(reportId)
    if (again) return { share: again, created: false }
    throw err
  }
}

export async function revokeShareForReport(reportId: string): Promise<number> {
  await ensureReportPdfSharesSchema()
  const rows = await dbQuery(
    `UPDATE report_pdf_shares
     SET is_active = FALSE,
         revoked_at = NOW(),
         updated_at = NOW()
     WHERE report_id = $1::uuid
       AND is_active = TRUE
       AND revoked_at IS NULL
     RETURNING id`,
    [reportId]
  )
  return rows.length
}

export async function revokeSharesForReports(reportIds: string[]): Promise<number> {
  await ensureReportPdfSharesSchema()
  if (!reportIds.length) return 0
  const rows = await dbQuery(
    `UPDATE report_pdf_shares
     SET is_active = FALSE,
         revoked_at = NOW(),
         updated_at = NOW()
     WHERE report_id = ANY($1::uuid[])
       AND is_active = TRUE
       AND revoked_at IS NULL
     RETURNING id`,
    [reportIds]
  )
  return rows.length
}

export async function revokeAllActiveShares(): Promise<number> {
  await ensureReportPdfSharesSchema()
  const rows = await dbQuery(
    `UPDATE report_pdf_shares
     SET is_active = FALSE,
         revoked_at = NOW(),
         updated_at = NOW()
     WHERE is_active = TRUE
       AND revoked_at IS NULL
     RETURNING id`
  )
  return rows.length
}

export async function countActiveShares(): Promise<number> {
  await ensureReportPdfSharesSchema()
  const rows = await dbQuery(
    `SELECT COUNT(*)::int AS total
     FROM report_pdf_shares
     WHERE is_active = TRUE
       AND revoked_at IS NULL`
  )
  return Number(rows[0]?.total || 0)
}

export async function touchShareAccess(shareId: string): Promise<void> {
  await ensureReportPdfSharesSchema()
  await dbQuery(
    `UPDATE report_pdf_shares
     SET access_count = access_count + 1,
         last_accessed_at = NOW(),
         updated_at = NOW()
     WHERE id = $1::uuid`,
    [shareId]
  )
}
