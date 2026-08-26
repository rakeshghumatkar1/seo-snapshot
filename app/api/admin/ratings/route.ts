import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { dbQuery } from '@/lib/db/client'

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20))
    const offset = (page - 1) * limit

    const [summaryRows, rows, countRows] = await Promise.all([
      dbQuery(
        `SELECT
           COUNT(*)::int AS total,
           ROUND(AVG(rating)::numeric, 1) AS avg_rating
         FROM ratings`
      ),
      dbQuery(
        `SELECT id, website_url, email, rating, comment, created_at
         FROM ratings
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      dbQuery(`SELECT COUNT(*)::int AS total FROM ratings`),
    ])

    const total = Number(countRows[0]?.total || 0)

    return NextResponse.json({
      summary: {
        total: Number(summaryRows[0]?.total || 0),
        avgRating: Number(summaryRows[0]?.avg_rating || 0),
      },
      rows,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (err) {
    console.error('[Admin/ratings GET]', err)
    return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 })
  }
}
