import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { dbQuery } from '@/lib/db/client'
import {
  ensureHomepageShowcaseSchema,
  ensureUniqueSlug,
  getShowcaseByReportId,
  slugifyDisplayName,
} from '@/lib/db/homepageShowcase'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureHomepageShowcaseSchema()
    const reportId = req.nextUrl.searchParams.get('reportId') || ''
    if (!UUID_RE.test(reportId)) {
      return NextResponse.json({ error: 'Valid reportId is required' }, { status: 400 })
    }

    const reportRows = await dbQuery(
      `SELECT id, website_url, report_type, created_at, status
       FROM reports
       WHERE id = $1
       LIMIT 1`,
      [reportId]
    )
    if (!reportRows.length) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const showcase = await getShowcaseByReportId(reportId)
    return NextResponse.json({
      report: reportRows[0],
      showcase: showcase || null,
    })
  } catch (err) {
    console.error('[Admin/showcase GET]', err)
    return NextResponse.json({ error: 'Failed to load showcase settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureHomepageShowcaseSchema()
    const body = await req.json()
    const reportId = typeof body.reportId === 'string' ? body.reportId : ''
    if (!UUID_RE.test(reportId)) {
      return NextResponse.json({ error: 'Valid reportId is required' }, { status: 400 })
    }

    const reportRows = await dbQuery(
      `SELECT id, website_url, report_type FROM reports WHERE id = $1 LIMIT 1`,
      [reportId]
    )
    if (!reportRows.length) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const isActive = Boolean(body.isActive)
    const useAsSample = Boolean(body.useAsSample)
    const showRecentlyAnalysed = Boolean(body.showRecentlyAnalysed)
    const showDomain = Boolean(body.showDomain)
    const featured = Boolean(body.featured)
    const displayOrder = Number.isFinite(Number(body.displayOrder))
      ? Math.max(0, Math.min(9999, Number(body.displayOrder)))
      : 0

    const publicDisplayName = String(body.publicDisplayName || '').trim().slice(0, 120)
    if ((isActive || useAsSample || showRecentlyAnalysed) && !publicDisplayName) {
      return NextResponse.json(
        { error: 'Public display name is required when publishing showcase entries' },
        { status: 400 }
      )
    }

    const publicDomain = String(body.publicDomain || '').trim().slice(0, 180) || null
    const businessCategory = String(body.businessCategory || '').trim().slice(0, 80) || null
    const requestedSlug = String(body.slug || publicDisplayName || 'sample-report').trim()
    const slug = await ensureUniqueSlug(requestedSlug || slugifyDisplayName(publicDisplayName), reportId)

    const rows = await dbQuery(
      `INSERT INTO homepage_showcase (
        report_id,
        slug,
        public_display_name,
        public_domain,
        business_category,
        use_as_sample,
        show_recently_analysed,
        show_domain,
        display_order,
        is_active,
        featured,
        updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
      ON CONFLICT (report_id) DO UPDATE SET
        slug = EXCLUDED.slug,
        public_display_name = EXCLUDED.public_display_name,
        public_domain = EXCLUDED.public_domain,
        business_category = EXCLUDED.business_category,
        use_as_sample = EXCLUDED.use_as_sample,
        show_recently_analysed = EXCLUDED.show_recently_analysed,
        show_domain = EXCLUDED.show_domain,
        display_order = EXCLUDED.display_order,
        is_active = EXCLUDED.is_active,
        featured = EXCLUDED.featured,
        updated_at = NOW()
      RETURNING *`,
      [
        reportId,
        slug,
        publicDisplayName || 'Untitled Business',
        publicDomain,
        businessCategory,
        useAsSample,
        showRecentlyAnalysed,
        showDomain,
        displayOrder,
        isActive,
        featured,
      ]
    )

    return NextResponse.json({ success: true, showcase: rows[0] })
  } catch (err) {
    console.error('[Admin/showcase POST]', err)
    return NextResponse.json({ error: 'Failed to save showcase settings' }, { status: 500 })
  }
}
