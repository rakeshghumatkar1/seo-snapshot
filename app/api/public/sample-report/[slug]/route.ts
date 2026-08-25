import { NextRequest, NextResponse } from 'next/server'
import { getPublicSampleBySlug } from '@/lib/db/homepageShowcase'
import { detectReportVersion } from '@/types/report'

export const dynamic = 'force-dynamic'

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
    const slug = decodeURIComponent(context.params.slug || '').trim()
    if (!slug) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const row = await getPublicSampleBySlug(slug)
    if (!row) {
      return NextResponse.json({ error: 'Sample report not found' }, { status: 404 })
    }

    const mode = row.sample_content_mode === 'anonymized' ? 'anonymized' : 'source'
    const reportType = row.report_type === 'detailed' ? 'detailed' : 'snapshot'

    let cleanSections: Record<string, string>
    let version: 2 | 3

    if (mode === 'anonymized') {
      // CRITICAL: never fall back to original reports.sections_json
      cleanSections = cleanSectionMap(row.anonymized_sections_json)
      if (!Object.keys(cleanSections).length) {
        return NextResponse.json({ error: 'Sample unavailable' }, { status: 404 })
      }
      version =
        row.anonymized_report_version === 2 || row.anonymized_report_version === 3
          ? row.anonymized_report_version
          : detectReportVersion(cleanSections)
    } else {
      cleanSections = cleanSectionMap(row.sections_json)
      version = detectReportVersion(row.sections_json || {})
    }

    const showDomain = mode === 'anonymized' ? false : Boolean(row.show_domain)

    return NextResponse.json({
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
    }, {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
        'X-Sample-Mode': mode,
        'X-Sample-Use': String(Boolean(row.use_as_sample)),
        'X-Sample-Status': String(row.anonymization_status || ''),
      },
    })
  } catch (err) {
    console.error('[public/sample-report]', err)
    return NextResponse.json({ error: 'Failed to load sample report' }, { status: 500 })
  }
}
