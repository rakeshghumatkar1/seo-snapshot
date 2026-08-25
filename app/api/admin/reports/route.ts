import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { ensureReportArchiveSchema } from '@/lib/db/reportArchive'
import { dbQuery } from '@/lib/db/client'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const SORT_COLUMNS: Record<string, string> = {
  created_at: 'created_at',
  website_url: 'website_url',
  report_type: 'report_type',
  email: 'email',
  status: 'status',
}

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureReportArchiveSchema()

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20))
    const offset = (page - 1) * limit
    const query = (searchParams.get('q') || '').trim()
    const type = searchParams.get('type') || 'all'
    const sortColumn = SORT_COLUMNS[searchParams.get('sort') || 'created_at'] || 'created_at'
    const sortDirection = searchParams.get('dir') === 'asc' ? 'ASC' : 'DESC'

    const clauses: string[] = []
    const params: any[] = []

    if (type === 'snapshot' || type === 'detailed') {
      params.push(type)
      clauses.push(`report_type = $${params.length}`)
    }

    if (query) {
      params.push(`%${query}%`)
      const p = `$${params.length}`
      clauses.push(`(
        COALESCE(website_url, '') ILIKE ${p} OR
        COALESCE(email, '') ILIKE ${p} OR
        COALESCE(report_type, '') ILIKE ${p} OR
        COALESCE(status, '') ILIKE ${p}
      )`)
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const rowParams = [...params, limit, offset]
    const limitParam = `$${params.length + 1}`
    const offsetParam = `$${params.length + 2}`

    const [rows, countRows, summaryRows] = await Promise.all([
      dbQuery(
        `SELECT
          id,
          website_url,
          report_type,
          email,
          status,
          sections_json,
          created_at,
          pdf_filename,
          pdf_generated_at,
          (pdf_base64 IS NOT NULL) AS has_pdf
         FROM reports
         ${where}
         ORDER BY ${sortColumn} ${sortDirection} NULLS LAST, created_at DESC
         LIMIT ${limitParam} OFFSET ${offsetParam}`,
        rowParams
      ),
      dbQuery(`SELECT COUNT(*) AS total FROM reports ${where}`, params),
      dbQuery(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE report_type = 'snapshot') AS snapshot,
          COUNT(*) FILTER (WHERE report_type = 'detailed') AS detailed,
          COUNT(*) FILTER (WHERE pdf_base64 IS NOT NULL) AS pdf_count
        FROM reports
      `),
    ])

    const total = Number(countRows[0]?.total || 0)

    return NextResponse.json({
      rows,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      summary: {
        total: Number(summaryRows[0]?.total || 0),
        snapshot: Number(summaryRows[0]?.snapshot || 0),
        detailed: Number(summaryRows[0]?.detailed || 0),
        pdfCount: Number(summaryRows[0]?.pdf_count || 0),
      },
    })
  } catch (err) {
    console.error('[Admin/reports GET]', err)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const ids = Array.isArray(body.ids)
      ? body.ids.filter((id: unknown): id is string => typeof id === 'string' && UUID_RE.test(id)).slice(0, 100)
      : []

    if (!ids.length) {
      return NextResponse.json({ error: 'No valid report ids supplied' }, { status: 400 })
    }

    const rows = await dbQuery(
      `DELETE FROM reports
       WHERE id = ANY($1::uuid[])
       RETURNING id`,
      [ids]
    )

    return NextResponse.json({ success: true, deleted: rows.length })
  } catch (err) {
    console.error('[Admin/reports DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
  }
}
