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

  const { searchParams } = new URL(req.url)
  const table = searchParams.get('table') || 'leads'
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 50
  const offset = (page - 1) * limit

  const allowedTables = ['leads', 'ratings', 'reports', 'rate_limits']

  if (!allowedTables.includes(table)) {
    return NextResponse.json(
      { error: 'Invalid table' },
      { status: 400 }
    )
  }

  try {
    const orderCol = table === 'rate_limits' ? 'updated_at' : 'created_at'
    const selectColumns = table === 'reports'
      ? `id, website_url, report_type, email, status, created_at,
         pdf_filename, pdf_generated_at,
         (pdf_base64 IS NOT NULL) AS has_pdf`
      : '*'

    const [rows, countResult] = await Promise.all([
      dbQuery(
        `SELECT ${selectColumns} FROM ${table}
         ORDER BY ${orderCol} DESC NULLS LAST
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      dbQuery(
        `SELECT COUNT(*) as total FROM ${table}`
      ),
    ])

    return NextResponse.json({
      rows,
      total: Number(countResult[0]?.total || 0),
      page,
      limit,
      totalPages: Math.ceil(Number(countResult[0]?.total || 0) / limit),
    })
  } catch (err) {
    console.error('[Admin/data]', err)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
