import { NextRequest, NextResponse } from 'next/server'
import { getPublicSampleBySlug } from '@/lib/db/homepageShowcase'
import { detectReportVersion } from '@/types/report'

export const dynamic = 'force-dynamic'

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

    const sections =
      typeof row.sections_json === 'object' && row.sections_json
        ? (row.sections_json as Record<string, unknown>)
        : {}

    // Strip metadata that must never be public
    const { reportVersion: _rv, ...sectionFields } = sections
    const cleanSections: Record<string, string> = {}
    for (const [key, value] of Object.entries(sectionFields)) {
      if (typeof value === 'string') cleanSections[key] = value
    }

    const reportType = row.report_type === 'detailed' ? 'detailed' : 'snapshot'
    const version = detectReportVersion(sections)

    return NextResponse.json({
      slug: row.slug,
      displayName: row.public_display_name,
      domain: row.show_domain ? row.public_domain || null : null,
      showDomain: Boolean(row.show_domain),
      businessCategory: row.business_category || null,
      reportType,
      reportVersion: version,
      generatedAt: row.created_at || null,
      sections: cleanSections,
      // Never include email, website_url raw unless show_domain uses public_domain
    })
  } catch (err) {
    console.error('[public/sample-report]', err)
    return NextResponse.json({ error: 'Failed to load sample report' }, { status: 500 })
  }
}
