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
  const format = searchParams.get('format') || 'csv'

  const allowedTables = ['leads', 'ratings', 'reports', 'rate_limits']

  if (!allowedTables.includes(table)) {
    return NextResponse.json(
      { error: 'Invalid table' },
      { status: 400 }
    )
  }

  try {
    const orderCol = table === 'rate_limits' ? 'updated_at' : 'created_at'

    const rows = await dbQuery(
      `SELECT * FROM ${table}
       ORDER BY ${orderCol} DESC NULLS LAST`
    )

    if (format === 'csv') {
      if (!rows.length) {
        return new NextResponse('No data found', {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${table}.csv"`,
          },
        })
      }

      const headers = Object.keys(rows[0])
      const csvRows = [
        headers.join(','),
        ...rows.map(row =>
          headers.map(h => {
            const val = row[h]
            if (val === null || val === undefined) return ''
            const str = String(val)
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`
            }
            return str
          }).join(',')
        ),
      ]

      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${table}_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // Excel format — return JSON, client handles xlsx generation
    return NextResponse.json({ rows, table })
  } catch (err) {
    console.error('[Admin/export]', err)
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    )
  }
}
