import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { ensureReportArchiveSchema } from '@/lib/db/reportArchive'
import { ensureHomepageShowcaseSchema } from '@/lib/db/homepageShowcase'
import {
  countActiveShares,
  ensureReportPdfSharesSchema,
} from '@/lib/db/reportPdfShares'
import { dbQuery } from '@/lib/db/client'
import {
  dateFilterCutoffUtc,
  parseDateFilter,
  parseLimit,
  parsePdfFilter,
  parseReportTypeFilter,
  parseSampleFilter,
  parseShareFilter,
  parseSortPreset,
  sampleStatusSqlCase,
  sortPresetToSql,
} from '@/lib/admin/reportFilters'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await Promise.all([
      ensureReportArchiveSchema(),
      ensureHomepageShowcaseSchema(),
      ensureReportPdfSharesSchema(),
    ])

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = parseLimit(searchParams.get('limit'))
    const offset = (page - 1) * limit
    const query = (searchParams.get('q') || '').trim()
    const type = parseReportTypeFilter(searchParams.get('type'))
    const pdf = parsePdfFilter(searchParams.get('pdf'))
    const sample = parseSampleFilter(searchParams.get('sample'))
    const share = parseShareFilter(searchParams.get('share'))
    const date = parseDateFilter(searchParams.get('date'))
    const sortPreset = parseSortPreset(searchParams.get('sort'))
    const { column: sortColumn, direction: sortDirection } = sortPresetToSql(sortPreset)

    const clauses: string[] = []
    const params: any[] = []

    if (type === 'snapshot' || type === 'detailed') {
      params.push(type)
      clauses.push(`r.report_type = $${params.length}`)
    }

    if (pdf === 'stored') {
      clauses.push(`r.pdf_base64 IS NOT NULL`)
    } else if (pdf === 'missing') {
      clauses.push(`r.pdf_base64 IS NULL`)
    }

    if (sample === 'published') {
      clauses.push(`(
        hs.sample_content_mode = 'anonymized'
        AND hs.anonymization_status = 'published'
        AND hs.use_as_sample = TRUE
      )`)
    } else if (sample === 'draft') {
      clauses.push(`(
        (
          hs.anonymized_sections_json IS NOT NULL
          OR hs.sample_content_mode = 'anonymized'
        )
        AND NOT (
          hs.sample_content_mode = 'anonymized'
          AND hs.anonymization_status = 'published'
          AND hs.use_as_sample = TRUE
        )
      )`)
    } else if (sample === 'none') {
      clauses.push(`(
        hs.id IS NULL
        OR (
          COALESCE(hs.sample_content_mode, 'source') <> 'anonymized'
          AND hs.anonymized_sections_json IS NULL
        )
      )`)
    }

    if (share === 'shared') {
      clauses.push(`rps.id IS NOT NULL`)
    } else if (share === 'private') {
      clauses.push(`rps.id IS NULL`)
    }

    const cutoff = dateFilterCutoffUtc(date)
    if (cutoff) {
      params.push(cutoff.toISOString())
      clauses.push(`r.created_at >= $${params.length}::timestamptz`)
    }

    if (query) {
      params.push(`%${query}%`)
      const p = `$${params.length}`
      clauses.push(`(
        COALESCE(r.website_url, '') ILIKE ${p} OR
        COALESCE(r.email, '') ILIKE ${p}
      )`)
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const rowParams = [...params, limit, offset]
    const limitParam = `$${params.length + 1}`
    const offsetParam = `$${params.length + 2}`
    const sampleStatusExpr = sampleStatusSqlCase()

    const fromJoin = `
      FROM reports r
      LEFT JOIN homepage_showcase hs ON hs.report_id = r.id
      LEFT JOIN report_pdf_shares rps
        ON rps.report_id = r.id
       AND rps.is_active = TRUE
       AND rps.revoked_at IS NULL
    `

    const [rows, countRows, summaryRows, activeShareCount] = await Promise.all([
      dbQuery(
        `SELECT
          r.id,
          r.website_url,
          r.report_type,
          r.email,
          r.status,
          r.sections_json,
          r.created_at,
          r.pdf_filename,
          r.pdf_generated_at,
          (r.pdf_base64 IS NOT NULL) AS has_pdf,
          hs.sample_content_mode,
          hs.anonymization_status,
          hs.use_as_sample,
          (${sampleStatusExpr}) AS sample_status,
          CASE WHEN rps.id IS NOT NULL THEN 'shared' ELSE 'private' END AS share_status,
          rps.created_at AS share_created_at
         ${fromJoin}
         ${where}
         ORDER BY ${sortColumn} ${sortDirection} NULLS LAST, r.created_at DESC
         LIMIT ${limitParam} OFFSET ${offsetParam}`,
        rowParams
      ),
      dbQuery(`SELECT COUNT(*) AS total ${fromJoin} ${where}`, params),
      dbQuery(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE report_type = 'snapshot') AS snapshot,
          COUNT(*) FILTER (WHERE report_type = 'detailed') AS detailed,
          COUNT(*) FILTER (WHERE pdf_base64 IS NOT NULL) AS pdf_count
        FROM reports
      `),
      countActiveShares(),
    ])

    const total = Number(countRows[0]?.total || 0)

    return NextResponse.json({
      rows,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit) || 1),
      summary: {
        total: Number(summaryRows[0]?.total || 0),
        snapshot: Number(summaryRows[0]?.snapshot || 0),
        detailed: Number(summaryRows[0]?.detailed || 0),
        pdfCount: Number(summaryRows[0]?.pdf_count || 0),
        activeShareCount,
      },
      filters: { type, pdf, sample, share, date, sort: sortPreset, q: query, limit },
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
      ? body.ids
          .filter((id: unknown): id is string => typeof id === 'string' && UUID_RE.test(id))
          .slice(0, 100)
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
