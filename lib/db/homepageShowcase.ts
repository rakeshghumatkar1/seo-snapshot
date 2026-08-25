import { dbQuery } from './client'
import { SQL_NORMALIZED_DOMAIN } from '@/lib/url/normalizeDomain'

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

  const [stats, samples, recent] = await Promise.all([
    getPublicUsageStats(),
    dbQuery(`
      SELECT
        hs.slug,
        hs.public_display_name,
        hs.public_domain,
        hs.show_domain,
        hs.business_category,
        hs.featured,
        r.report_type
      FROM homepage_showcase hs
      INNER JOIN reports r ON r.id = hs.report_id
      WHERE hs.is_active = TRUE
        AND hs.use_as_sample = TRUE
        AND COALESCE(r.status, 'success') = 'success'
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

  return {
    stats,
    sampleReports: samples.map((row: any) => ({
      slug: row.slug,
      displayName: row.public_display_name,
      domain: row.show_domain ? row.public_domain || null : null,
      showDomain: Boolean(row.show_domain),
      reportType: row.report_type === 'detailed' ? 'detailed' : 'snapshot',
      businessCategory: row.business_category || null,
      featured: Boolean(row.featured),
    })),
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
      hs.updated_at,
      r.report_type,
      r.created_at,
      r.sections_json,
      r.website_url
     FROM homepage_showcase hs
     INNER JOIN reports r ON r.id = hs.report_id
     WHERE hs.slug = $1
       AND hs.is_active = TRUE
       AND hs.use_as_sample = TRUE
       AND COALESCE(r.status, 'success') = 'success'
     LIMIT 1`,
    [slug]
  )
  return rows[0] || null
}
