import { dbQuery } from './client'
import { SQL_NORMALIZED_DOMAIN } from '@/lib/url/normalizeDomain'
import {
  normalizeAnonymizedBusinessReferences,
  preferAnonymizedHomepageSamples,
} from '@/lib/anonymize/normalizeBusinessReferences'

let schemaPromise: Promise<void> | null = null

export async function ensureHomepageShowcaseSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await dbQuery(`
        CREATE TABLE IF NOT EXISTS homepage_showcase (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          report_id UUID NOT NULL UNIQUE REFERENCES reports(id) ON DELETE CASCADE,
          slug TEXT NOT NULL UNIQUE,
          public_display_name TEXT NOT NULL,
          public_domain TEXT,
          business_category TEXT,
          use_as_sample BOOLEAN NOT NULL DEFAULT FALSE,
          show_recently_analysed BOOLEAN NOT NULL DEFAULT FALSE,
          show_domain BOOLEAN NOT NULL DEFAULT FALSE,
          display_order INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          featured BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)

      await dbQuery(`
        CREATE INDEX IF NOT EXISTS idx_homepage_showcase_active_order
        ON homepage_showcase (is_active, display_order ASC, updated_at DESC)
      `)

      await dbQuery(`
        CREATE INDEX IF NOT EXISTS idx_homepage_showcase_sample
        ON homepage_showcase (is_active, use_as_sample, display_order ASC)
      `)

      // Anonymised public sample fields (safe idempotent additive migration)
      await dbQuery(`ALTER TABLE homepage_showcase ADD COLUMN IF NOT EXISTS sample_content_mode TEXT NOT NULL DEFAULT 'source'`)
      await dbQuery(`ALTER TABLE homepage_showcase ADD COLUMN IF NOT EXISTS anonymized_sections_json JSONB`)
      await dbQuery(`ALTER TABLE homepage_showcase ADD COLUMN IF NOT EXISTS anonymized_report_version INTEGER`)
      await dbQuery(`ALTER TABLE homepage_showcase ADD COLUMN IF NOT EXISTS public_location TEXT`)
      await dbQuery(`ALTER TABLE homepage_showcase ADD COLUMN IF NOT EXISTS anonymization_status TEXT NOT NULL DEFAULT 'none'`)
      await dbQuery(`ALTER TABLE homepage_showcase ADD COLUMN IF NOT EXISTS anonymization_audit_json JSONB`)
      await dbQuery(`ALTER TABLE homepage_showcase ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMP WITH TIME ZONE`)
      await dbQuery(`ALTER TABLE homepage_showcase ADD COLUMN IF NOT EXISTS anonymization_updated_at TIMESTAMP WITH TIME ZONE`)
    })().catch(err => {
      schemaPromise = null
      throw err
    })
  }

  return schemaPromise
}

export type PublicUsageStats = {
  websitesAnalysed: number
  reportsGenerated: number
  detailedReportsCreated: number
}

export async function getPublicUsageStats(): Promise<PublicUsageStats> {
  const rows = await dbQuery(`
    SELECT
      COUNT(*) FILTER (
        WHERE COALESCE(status, 'success') = 'success'
          AND report_type IN ('snapshot', 'detailed')
      )::int AS reports_generated,
      COUNT(*) FILTER (
        WHERE COALESCE(status, 'success') = 'success'
          AND report_type = 'detailed'
      )::int AS detailed_reports,
      COUNT(DISTINCT ${SQL_NORMALIZED_DOMAIN}) FILTER (
        WHERE COALESCE(status, 'success') = 'success'
          AND report_type IN ('snapshot', 'detailed')
          AND ${SQL_NORMALIZED_DOMAIN} IS NOT NULL
      )::int AS websites_analysed
    FROM reports
  `)

  return {
    websitesAnalysed: Number(rows[0]?.websites_analysed || 0),
    reportsGenerated: Number(rows[0]?.reports_generated || 0),
    detailedReportsCreated: Number(rows[0]?.detailed_reports || 0),
  }
}

export type ShowcasePublicSample = {
  slug: string
  displayName: string
  domain: string | null
  showDomain: boolean
  reportType: 'snapshot' | 'detailed'
  businessCategory: string | null
  publicLocation: string | null
  sampleContentMode: 'source' | 'anonymized'
  featured: boolean
}

export type ShowcaseRecentBusiness = {
  displayName: string
  domain: string | null
}

export async function getPublicHomepageShowcase(): Promise<{
  stats: PublicUsageStats
  sampleReports: ShowcasePublicSample[]
  recentBusinesses: ShowcaseRecentBusiness[]
}> {
  await ensureHomepageShowcaseSchema()

  const [stats, anonymizedSamples, sourceSamples, recent] = await Promise.all([
    getPublicUsageStats(),
    dbQuery(`
      SELECT
        hs.slug,
        hs.public_display_name,
        hs.public_domain,
        hs.show_domain,
        hs.business_category,
        hs.public_location,
        hs.featured,
        hs.sample_content_mode,
        hs.anonymization_status,
        hs.anonymized_sections_json,
        r.report_type
      FROM homepage_showcase hs
      INNER JOIN reports r ON r.id = hs.report_id
      WHERE hs.is_active = TRUE
        AND hs.use_as_sample = TRUE
        AND COALESCE(r.status, 'success') = 'success'
        AND hs.sample_content_mode = 'anonymized'
        AND hs.anonymization_status = 'published'
        AND hs.anonymized_sections_json IS NOT NULL
      ORDER BY hs.featured DESC, hs.display_order ASC, hs.updated_at DESC
      LIMIT 12
    `),
    dbQuery(`
      SELECT
        hs.slug,
        hs.public_display_name,
        hs.public_domain,
        hs.show_domain,
        hs.business_category,
        hs.public_location,
        hs.featured,
        hs.sample_content_mode,
        hs.anonymization_status,
        hs.anonymized_sections_json,
        r.report_type
      FROM homepage_showcase hs
      INNER JOIN reports r ON r.id = hs.report_id
      WHERE hs.is_active = TRUE
        AND hs.use_as_sample = TRUE
        AND COALESCE(r.status, 'success') = 'success'
        AND COALESCE(hs.sample_content_mode, 'source') = 'source'
      ORDER BY hs.featured DESC, hs.display_order ASC, hs.updated_at DESC
      LIMIT 12
    `),
    dbQuery(`
      SELECT
        hs.public_display_name,
        CASE WHEN hs.show_domain THEN hs.public_domain ELSE NULL END AS public_domain
      FROM homepage_showcase hs
      INNER JOIN reports r ON r.id = hs.report_id
      WHERE hs.is_active = TRUE
        AND hs.show_recently_analysed = TRUE
        AND COALESCE(r.status, 'success') = 'success'
      ORDER BY hs.display_order ASC, hs.updated_at DESC
      LIMIT 24
    `),
  ])

  // Prefer published anonymised samples on the homepage; fall back to source samples only if none exist.
  const samples = preferAnonymizedHomepageSamples(anonymizedSamples, sourceSamples)

  return {
    stats,
    sampleReports: samples.map((row: any) => {
      const mode = row.sample_content_mode === 'anonymized' ? 'anonymized' : 'source'
      const showDomain = mode === 'anonymized' ? false : Boolean(row.show_domain)
      return {
        slug: row.slug,
        displayName: row.public_display_name,
        domain: showDomain ? row.public_domain || null : null,
        showDomain,
        reportType: row.report_type === 'detailed' ? 'detailed' : 'snapshot',
        businessCategory: row.business_category || null,
        publicLocation: row.public_location || null,
        sampleContentMode: mode as 'source' | 'anonymized',
        featured: Boolean(row.featured),
      }
    }),
    recentBusinesses: recent.map((row: any) => ({
      displayName: row.public_display_name,
      domain: row.public_domain || null,
    })),
  }
}

export function slugifyDisplayName(value: string): string {
  const base = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

  return base || `sample-report-${Date.now().toString(36)}`
}

export async function ensureUniqueSlug(desired: string, excludeReportId?: string): Promise<string> {
  await ensureHomepageShowcaseSchema()
  const base = slugifyDisplayName(desired)
  let candidate = base
  let attempt = 1

  while (attempt < 50) {
    const params: any[] = [candidate]
    let sql = `SELECT id FROM homepage_showcase WHERE slug = $1`
    if (excludeReportId) {
      params.push(excludeReportId)
      sql += ` AND report_id <> $2`
    }
    sql += ` LIMIT 1`

    const existing = await dbQuery(sql, params)
    if (!existing.length) return candidate
    attempt += 1
    candidate = `${base}-${attempt}`
  }

  return `${base}-${Date.now().toString(36)}`
}

export async function getShowcaseByReportId(reportId: string) {
  await ensureHomepageShowcaseSchema()
  const rows = await dbQuery(
    `SELECT *
     FROM homepage_showcase
     WHERE report_id = $1
     LIMIT 1`,
    [reportId]
  )
  return rows[0] || null
}

export async function getPublicSampleBySlug(slug: string) {
  await ensureHomepageShowcaseSchema()
  const rows = await dbQuery(
    `SELECT
      hs.slug,
      hs.public_display_name,
      hs.public_domain,
      hs.show_domain,
      hs.business_category,
      hs.public_location,
      hs.sample_content_mode,
      hs.anonymization_status,
      hs.anonymized_sections_json,
      hs.anonymized_report_version,
      hs.use_as_sample,
      hs.updated_at,
      r.report_type,
      r.created_at,
      r.sections_json
     FROM homepage_showcase hs
     INNER JOIN reports r ON r.id = hs.report_id
     WHERE hs.slug = $1
       AND hs.is_active = TRUE
       AND hs.use_as_sample = TRUE
       AND COALESCE(r.status, 'success') = 'success'
       AND (
         COALESCE(hs.sample_content_mode, 'source') = 'source'
         OR (
           hs.sample_content_mode = 'anonymized'
           AND hs.anonymization_status = 'published'
           AND hs.anonymized_sections_json IS NOT NULL
         )
       )
     LIMIT 1`,
    [slug]
  )
  const row = rows[0] || null
  if (!row) return null

  // Defense in depth: anonymised samples must never fall back to original sections
  if (row.sample_content_mode === 'anonymized') {
    if (
      row.anonymization_status !== 'published' ||
      !row.use_as_sample ||
      !row.anonymized_sections_json ||
      typeof row.anonymized_sections_json !== 'object'
    ) {
      return null
    }
  }

  return row
}

export async function upsertAnonymizedShowcaseMeta(input: {
  reportId: string
  slug: string
  publicDisplayName: string
  businessCategory: string | null
  publicLocation: string | null
  featured: boolean
  displayOrder: number
  isActive?: boolean
}) {
  await ensureHomepageShowcaseSchema()
  const rows = await dbQuery(
    `INSERT INTO homepage_showcase (
      report_id,
      slug,
      public_display_name,
      public_domain,
      business_category,
      public_location,
      use_as_sample,
      show_recently_analysed,
      show_domain,
      display_order,
      is_active,
      featured,
      sample_content_mode,
      anonymization_status,
      updated_at,
      anonymization_updated_at
    ) VALUES ($1,$2,$3,NULL,$4,$5,FALSE,FALSE,FALSE,$6,COALESCE($7,TRUE),$8,'anonymized','none',NOW(),NOW())
    ON CONFLICT (report_id) DO UPDATE SET
      slug = EXCLUDED.slug,
      public_display_name = EXCLUDED.public_display_name,
      business_category = EXCLUDED.business_category,
      public_location = EXCLUDED.public_location,
      show_domain = FALSE,
      display_order = EXCLUDED.display_order,
      is_active = COALESCE($7, homepage_showcase.is_active),
      featured = EXCLUDED.featured,
      sample_content_mode = 'anonymized',
      updated_at = NOW(),
      anonymization_updated_at = NOW()
    RETURNING *`,
    [
      input.reportId,
      input.slug,
      input.publicDisplayName,
      input.businessCategory,
      input.publicLocation,
      input.displayOrder,
      typeof input.isActive === 'boolean' ? input.isActive : null,
      input.featured,
    ]
  )
  return rows[0]
}

export async function saveAnonymizedDraft(input: {
  reportId: string
  sections: Record<string, string>
  reportVersion: number
  status: string
  audit: unknown
}) {
  await ensureHomepageShowcaseSchema()
  const existing = await getShowcaseByReportId(input.reportId)
  const label = String(existing?.public_display_name || '').trim()
  const sections = label
    ? normalizeAnonymizedBusinessReferences(input.sections, label)
    : input.sections

  const rows = await dbQuery(
    `UPDATE homepage_showcase SET
      anonymized_sections_json = $2::jsonb,
      anonymized_report_version = $3,
      anonymization_status = $4,
      anonymization_audit_json = $5::jsonb,
      anonymized_at = NOW(),
      anonymization_updated_at = NOW(),
      sample_content_mode = 'anonymized',
      show_domain = FALSE,
      use_as_sample = FALSE,
      updated_at = NOW()
     WHERE report_id = $1
     RETURNING *`,
    [
      input.reportId,
      JSON.stringify(sections),
      input.reportVersion,
      input.status,
      JSON.stringify(input.audit ?? null),
    ]
  )
  return rows[0] || null
}

export async function setAnonymizationStatus(reportId: string, status: string) {
  await ensureHomepageShowcaseSchema()
  const rows = await dbQuery(
    `UPDATE homepage_showcase SET
      anonymization_status = $2,
      anonymization_updated_at = NOW(),
      updated_at = NOW()
     WHERE report_id = $1
     RETURNING *`,
    [reportId, status]
  )
  return rows[0] || null
}

export async function publishAnonymizedSample(reportId: string) {
  await ensureHomepageShowcaseSchema()
  const rows = await dbQuery(
    `UPDATE homepage_showcase SET
      use_as_sample = TRUE,
      is_active = TRUE,
      show_domain = FALSE,
      show_recently_analysed = FALSE,
      sample_content_mode = 'anonymized',
      anonymization_status = 'published',
      anonymization_updated_at = NOW(),
      updated_at = NOW()
     WHERE report_id = $1
     RETURNING *`,
    [reportId]
  )
  return rows[0] || null
}

export async function unpublishAnonymizedSample(reportId: string) {
  await ensureHomepageShowcaseSchema()
  const rows = await dbQuery(
    `UPDATE homepage_showcase SET
      use_as_sample = FALSE,
      anonymization_status = CASE
        WHEN anonymized_sections_json IS NOT NULL THEN 'draft'
        ELSE anonymization_status
      END,
      anonymization_updated_at = NOW(),
      updated_at = NOW()
     WHERE report_id = $1
     RETURNING *`,
    [reportId]
  )
  return rows[0] || null
}
