import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { dbQuery } from '@/lib/db/client'

const SORT_COLUMNS: Record<string, string> = {
  created_at: 'created_at',
  name: 'name',
  company: 'company',
  email: 'email',
  website_url: 'website_url',
  requested_report_type: 'requested_report_type',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function validIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((id): id is string => typeof id === 'string' && UUID_RE.test(id))
    .slice(0, 100)
}

async function requireAdmin() {
  return isAdminAuthenticated()
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20))
    const offset = (page - 1) * limit
    const query = (searchParams.get('q') || '').trim()
    const requestedSort = searchParams.get('sort') || 'created_at'
    const sortColumn = SORT_COLUMNS[requestedSort] || 'created_at'
    const sortDirection = searchParams.get('dir') === 'asc' ? 'ASC' : 'DESC'

    const params: any[] = []
    let where = ''

    if (query) {
      params.push(`%${query}%`)
      const p = `$${params.length}`
      where = `WHERE (
        COALESCE(email, '') ILIKE ${p} OR
        COALESCE(name, '') ILIKE ${p} OR
        COALESCE(company, '') ILIKE ${p} OR
        COALESCE(website_url, '') ILIKE ${p} OR
        COALESCE(requested_report_type, '') ILIKE ${p}
      )`
    }

    const rowParams = [...params, limit, offset]
    const limitParam = `$${params.length + 1}`
    const offsetParam = `$${params.length + 2}`

    const [rows, countRows] = await Promise.all([
      dbQuery(
        `SELECT id, email, name, company, website_url, requested_report_type, created_at
         FROM leads
         ${where}
         ORDER BY ${sortColumn} ${sortDirection} NULLS LAST, created_at DESC
         LIMIT ${limitParam} OFFSET ${offsetParam}`,
        rowParams
      ),
      dbQuery(`SELECT COUNT(*) AS total FROM leads ${where}`, params),
    ])

    const total = Number(countRows[0]?.total || 0)

    return NextResponse.json({
      rows,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (err) {
    console.error('[Admin/leads GET]', err)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
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
    const requestedReportType = typeof updates.requestedReportType === 'string' ? updates.requestedReportType.trim() : ''

    if (!id || !email || !websiteUrl || !requestedReportType) {
      return NextResponse.json({ error: 'Lead id, email, website and report type are required' }, { status: 400 })
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
        typeof updates.company === 'string' && updates.company.trim() ? updates.company.trim() : null,
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
  if (!(await requireAdmin())) {
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
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }
}
