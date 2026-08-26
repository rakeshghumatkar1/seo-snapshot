import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { dbQuery } from '@/lib/db/client'
import {
  leadDateCutoffUtc,
  leadSortToSql,
  parseLeadDateFilter,
  parseLeadLimit,
  parseLeadSortPreset,
  parseLeadTypeFilter,
} from '@/lib/admin/leadFilters'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function validIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((id): id is string => typeof id === 'string' && UUID_RE.test(id))
    .slice(0, 100)
}

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = parseLeadLimit(searchParams.get('limit'))
    const offset = (page - 1) * limit
    const query = (searchParams.get('q') || '').trim()
    const type = parseLeadTypeFilter(searchParams.get('type'))
    const date = parseLeadDateFilter(searchParams.get('date'))
    const sortPreset = parseLeadSortPreset(searchParams.get('sort'))
    const { column: sortColumn, direction: sortDirection } = leadSortToSql(sortPreset)

    const clauses: string[] = []
    const params: any[] = []

    if (type !== 'all') {
      params.push(type)
      clauses.push(`LOWER(COALESCE(requested_report_type, '')) = $${params.length}`)
    }

    const cutoff = leadDateCutoffUtc(date)
    if (cutoff) {
      params.push(cutoff.toISOString())
      clauses.push(`created_at >= $${params.length}::timestamptz`)
    }

    if (query) {
      params.push(`%${query}%`)
      const p = `$${params.length}`
      clauses.push(`(
        COALESCE(email, '') ILIKE ${p} OR
        COALESCE(name, '') ILIKE ${p} OR
        COALESCE(company, '') ILIKE ${p} OR
        COALESCE(website_url, '') ILIKE ${p} OR
        COALESCE(requested_report_type, '') ILIKE ${p}
      )`)
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const rowParams = [...params, limit, offset]
    const limitParam = `$${params.length + 1}`
    const offsetParam = `$${params.length + 2}`

    const [rows, countRows, summaryRows] = await Promise.all([
      dbQuery(
        `SELECT id, email, name, company, website_url, requested_report_type, created_at
         FROM leads
         ${where}
         ORDER BY ${sortColumn} ${sortDirection} NULLS LAST, created_at DESC
         LIMIT ${limitParam} OFFSET ${offsetParam}`,
        rowParams
      ),
      dbQuery(`SELECT COUNT(*) AS total FROM leads ${where}`, params),
      dbQuery(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (
             WHERE LOWER(COALESCE(requested_report_type, '')) = 'detailed'
           )::int AS detailed_count,
           COUNT(*) FILTER (
             WHERE created_at >= NOW() - INTERVAL '7 days'
           )::int AS recent_count
         FROM leads`
      ),
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
        detailedCount: Number(summaryRows[0]?.detailed_count || 0),
        recentCount: Number(summaryRows[0]?.recent_count || 0),
      },
      filters: { type, date, sort: sortPreset, q: query, limit },
    })
  } catch (err) {
    console.error('[Admin/leads GET]', err)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()

    if (body.action !== 'edit') {
      return NextResponse.json({ error: 'Unsupported lead update action' }, { status: 400 })
    }

    const id = typeof body.id === 'string' && UUID_RE.test(body.id) ? body.id : null
    const updates = body.updates || {}
    const email = typeof updates.email === 'string' ? updates.email.trim().toLowerCase() : ''
    const websiteUrl = typeof updates.websiteUrl === 'string' ? updates.websiteUrl.trim() : ''
    const requestedReportType =
      typeof updates.requestedReportType === 'string' ? updates.requestedReportType.trim() : ''

    if (!id || !email || !websiteUrl || !requestedReportType) {
      return NextResponse.json(
        { error: 'Lead id, email, website and report type are required' },
        { status: 400 }
      )
    }

    const rows = await dbQuery(
      `UPDATE leads
       SET email = $1,
           name = $2,
           company = $3,
           website_url = $4,
           requested_report_type = $5
       WHERE id = $6
       RETURNING id, email, name, company, website_url, requested_report_type, created_at`,
      [
        email,
        typeof updates.name === 'string' && updates.name.trim() ? updates.name.trim() : null,
        typeof updates.company === 'string' && updates.company.trim()
          ? updates.company.trim()
          : null,
        websiteUrl,
        requestedReportType,
        id,
      ]
    )

    if (!rows.length) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, lead: rows[0] })
  } catch (err) {
    console.error('[Admin/leads PATCH]', err)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const ids = validIds(body.ids)

    if (!ids.length) {
      return NextResponse.json({ error: 'No valid lead ids supplied' }, { status: 400 })
    }

    const rows = await dbQuery(
      `DELETE FROM leads
       WHERE id = ANY($1::uuid[])
       RETURNING id`,
      [ids]
    )

    return NextResponse.json({ success: true, deleted: rows.length })
  } catch (err) {
    console.error('[Admin/leads DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete leads' }, { status: 500 })
  }
}
