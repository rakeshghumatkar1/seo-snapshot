import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { dbQuery } from '@/lib/db/client'
import { sampleStatusSqlCase } from '@/lib/admin/reportFilters'

export async function GET(req: NextRequest) {
  const auth = await isAdminAuthenticated()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sampleStatusExpr = sampleStatusSqlCase()

    const [
      leadsResult,
      ratingsResult,
      reportsResult,
      rateLimitsResult,
      dailyLeadsResult,
      dailyReportsResult,
      topDomainsResult,
      ratingStatsResult,
      todayActivityResult,
      publishedSamplesResult,
      activeSharesResult,
      needsReviewResult,
      missingPdfResult,
      recentLeadsResult,
      recentReportsResult,
    ] = await Promise.all([
      dbQuery(
        `SELECT COUNT(*) as total,
          COUNT(DISTINCT website_url) as company_count,
          COUNT(CASE WHEN requested_report_type = 'pdf' THEN 1 END) as pdf_count,
          COUNT(CASE WHEN requested_report_type = 'detailed' THEN 1 END) as detailed_count
         FROM leads`
      ),
      dbQuery(
        `SELECT COUNT(*) as total,
          ROUND(AVG(rating)::numeric, 1) as avg_rating
         FROM ratings`
      ),
      dbQuery(
        `SELECT COUNT(*) as total,
          COUNT(CASE WHEN report_type = 'snapshot' THEN 1 END) as snapshot_count,
          COUNT(CASE WHEN report_type = 'detailed' THEN 1 END) as detailed_count
         FROM reports`
      ),
      dbQuery(
        `SELECT 
          COUNT(DISTINCT ip_address) as total_ips,
          COALESCE(SUM(request_count), 0) as total_requests
         FROM rate_limits
         WHERE reset_at > NOW()`
      ),
      dbQuery(
        `SELECT DATE(created_at) as date, COUNT(*) as count
         FROM leads
         WHERE created_at > NOW() - INTERVAL '7 days'
         GROUP BY DATE(created_at)
         ORDER BY date ASC`
      ),
      dbQuery(
        `SELECT DATE(created_at) as date, COUNT(*) as count
         FROM reports
         WHERE created_at > NOW() - INTERVAL '7 days'
         GROUP BY DATE(created_at)
         ORDER BY date ASC`
      ),
      dbQuery(
        `SELECT website_url, COUNT(*) as count
         FROM reports
         GROUP BY website_url
         ORDER BY count DESC
         LIMIT 10`
      ),
      dbQuery(
        `SELECT rating, COUNT(*) as count
         FROM ratings
         GROUP BY rating
         ORDER BY rating DESC`
      ),
      dbQuery(
        `SELECT 
          COALESCE(SUM(request_count), 0) as today_requests,
          COUNT(DISTINCT ip_address) as unique_ips
         FROM rate_limits
         WHERE reset_at > NOW()
           AND first_request_at > NOW() - INTERVAL '24 hours'`
      ),
      dbQuery(
        `SELECT COUNT(*)::int AS total
         FROM homepage_showcase
         WHERE sample_content_mode = 'anonymized'
           AND anonymization_status = 'published'
           AND use_as_sample = TRUE`
      ),
      dbQuery(
        `SELECT COUNT(*)::int AS total
         FROM report_pdf_shares
         WHERE is_active = TRUE
           AND revoked_at IS NULL`
      ),
      dbQuery(
        `SELECT COUNT(*)::int AS total
         FROM homepage_showcase
         WHERE sample_content_mode = 'anonymized'
           AND anonymization_status = 'needs_review'`
      ),
      dbQuery(
        `SELECT COUNT(*)::int AS total
         FROM reports
         WHERE pdf_base64 IS NULL
           AND COALESCE(status, 'success') = 'success'`
      ),
      dbQuery(
        `SELECT id, email, name, company, website_url, requested_report_type, created_at
         FROM leads
         ORDER BY created_at DESC
         LIMIT 5`
      ),
      dbQuery(
        `SELECT
          r.id,
          r.website_url,
          r.report_type,
          r.created_at,
          r.pdf_filename,
          (r.pdf_base64 IS NOT NULL) AS has_pdf,
          ${sampleStatusExpr} AS sample_status,
          CASE WHEN rps.id IS NOT NULL THEN 'shared' ELSE 'private' END AS share_status
         FROM reports r
         LEFT JOIN homepage_showcase hs ON hs.report_id = r.id
         LEFT JOIN report_pdf_shares rps
           ON rps.report_id = r.id
          AND rps.is_active = TRUE
          AND rps.revoked_at IS NULL
         ORDER BY r.created_at DESC
         LIMIT 5`
      ),
    ])

    const needsReview = Number(needsReviewResult[0]?.total || 0)
    const missingPdf = Number(missingPdfResult[0]?.total || 0)
    const activeShares = Number(activeSharesResult[0]?.total || 0)
    const publishedSamples = Number(publishedSamplesResult[0]?.total || 0)

    const attention: Array<{
      id: string
      label: string
      count: number
      href: string
      tone: 'warn' | 'info' | 'muted'
    }> = []

    if (needsReview > 0) {
      attention.push({
        id: 'needs_review',
        label:
          needsReview === 1
            ? '1 sample draft needs privacy review'
            : `${needsReview} sample drafts need privacy review`,
        count: needsReview,
        href: '/admin/dashboard/reports?sample=needs_review',
        tone: 'warn',
      })
    }
    if (missingPdf > 0) {
      attention.push({
        id: 'missing_pdf',
        label:
          missingPdf === 1
            ? '1 report is missing a stored PDF'
            : `${missingPdf} reports are missing a stored PDF`,
        count: missingPdf,
        href: '/admin/dashboard/reports?pdf=missing',
        tone: 'warn',
      })
    }
    if (activeShares > 0) {
      attention.push({
        id: 'active_shares',
        label:
          activeShares === 1
            ? '1 active shared PDF link'
            : `${activeShares} active shared PDF links`,
        count: activeShares,
        href: '/admin/dashboard/reports?share=shared',
        tone: 'info',
      })
    }

    return NextResponse.json({
      leads: {
        total: Number(leadsResult[0]?.total || 0),
        companyCount: Number(leadsResult[0]?.company_count || 0),
        pdfCount: Number(leadsResult[0]?.pdf_count || 0),
        detailedCount: Number(leadsResult[0]?.detailed_count || 0),
      },
      ratings: {
        total: Number(ratingsResult[0]?.total || 0),
        avgRating: Number(ratingsResult[0]?.avg_rating || 0),
        distribution: ratingStatsResult,
      },
      reports: {
        total: Number(reportsResult[0]?.total || 0),
        snapshotCount: Number(reportsResult[0]?.snapshot_count || 0),
        detailedCount: Number(reportsResult[0]?.detailed_count || 0),
      },
      samples: {
        published: publishedSamples,
        needsReview,
      },
      shares: {
        active: activeShares,
      },
      attention,
      recentLeads: recentLeadsResult,
      recentReports: recentReportsResult,
      rateLimits: {
        activeIps: Number(rateLimitsResult[0]?.total_ips || 0),
        totalRequests: Number(rateLimitsResult[0]?.total_requests || 0),
      },
      todayActivity: {
        requests: Number(todayActivityResult[0]?.today_requests || 0),
        uniqueIps: Number(todayActivityResult[0]?.unique_ips || 0),
      },
      dailyLeads: dailyLeadsResult,
      dailyReports: dailyReportsResult,
      topDomains: topDomainsResult,
      ratingDistribution: ratingStatsResult,
    })
  } catch (err) {
    console.error('[Admin/stats]', err)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
