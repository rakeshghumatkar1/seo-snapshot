import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { dbQuery } from '@/lib/db/client'

export async function GET(req: NextRequest) {
  const auth = await isAdminAuthenticated()
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
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
    ] = await Promise.all([
      dbQuery(
        `SELECT COUNT(*) as total,
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
         FROM leads
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
    ])

    return NextResponse.json({
      leads: {
        total: Number(leadsResult[0]?.total || 0),
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
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
