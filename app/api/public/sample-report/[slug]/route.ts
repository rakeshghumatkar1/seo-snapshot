import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db/client'
import { ensureHomepageShowcaseSchema } from '@/lib/db/homepageShowcase'
import { normalizeAnonymizedBusinessReferences } from '@/lib/anonymize/normalizeBusinessReferences'
import { detectReportVersion } from '@/types/report'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function cleanSectionMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {}
  const clean: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (key === 'reportVersion') continue
    if (typeof value === 'string') clean[key] = value
  }
  return clean
}

export async function GET(
  _req: NextRequest,
  context: { params: { slug: string } }
) {
  try {
    await ensureHomepageShowcaseSchema()
    const slug = decodeURIComponent(context.params.slug || '').trim()
    if (!slug) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

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
         AND hs.use_as_sample IS TRUE
         AND COALESCE(r.status, 'success') = 'success'
         AND (
           COALESCE(hs.sample_content_mode, 'source') <> 'anonymized'
           OR (
             hs.sample_content_mode = 'anonymized'
             AND hs.anonymization_status = 'published'
             AND hs.anonymized_sections_json IS NOT NULL
           )
         )
       LIMIT 1`,
      [slug]
    )

    const row = rows[0]
    if (!row) {
      return NextResponse.json(
        { error: 'Sample report not found' },
        {
          status: 404,
          headers: {
            'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
            'X-Sample-Guard': 'v2-miss',
          },
        }
      )
    }

    // Absolute deny for unpublished anonymised drafts
    if (
      row.sample_content_mode === 'anonymized' &&
      (row.anonymization_status !== 'published' || row.use_as_sample !== true)
    ) {
      return NextResponse.json(
        { error: 'Sample report not found' },
        {
          status: 404,
          headers: {
            'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
            'X-Sample-Guard': 'v2-deny',
          },
        }
      )
    }

    const mode = row.sample_content_mode === 'anonymized' ? 'anonymized' : 'source'
    const reportType = row.report_type === 'detailed' ? 'detailed' : 'snapshot'

    let cleanSections: Record<string, string>
    let version: 2 | 3

    if (mode === 'anonymized') {
      cleanSections = cleanSectionMap(row.anonymized_sections_json)
      if (!Object.keys(cleanSections).length) {
        return NextResponse.json({ error: 'Sample unavailable' }, { status: 404 })
      }
      cleanSections = normalizeAnonymizedBusinessReferences(
        cleanSections,
        String(row.public_display_name || '')
      )
      version =
        row.anonymized_report_version === 2 || row.anonymized_report_version === 3
          ? row.anonymized_report_version
          : detectReportVersion(cleanSections)
    } else {
      cleanSections = cleanSectionMap(row.sections_json)
      version = detectReportVersion(row.sections_json || {})
    }

    const showDomain = mode === 'anonymized' ? false : Boolean(row.show_domain)

    return NextResponse.json(
      {
        slug: row.slug,
        displayName: row.public_display_name,
        domain: showDomain ? row.public_domain || null : null,
        showDomain,
        businessCategory: row.business_category || null,
        publicLocation: row.public_location || null,
        reportType,
        reportVersion: version,
        generatedAt: row.created_at || null,
        sections: cleanSections,
        sampleContentMode: mode,
        isAnonymizedSample: mode === 'anonymized',
      },
      {
        headers: {
          'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
          'X-Sample-Guard': 'v2-hit',
          'X-Sample-Mode': mode,
          'X-Sample-Use': String(row.use_as_sample === true),
          'X-Sample-Status': String(row.anonymization_status || ''),
        },
      }
    )
  } catch (err) {
    console.error('[public/sample-report]', err)
    return NextResponse.json({ error: 'Failed to load sample report' }, { status: 500 })
  }
}
