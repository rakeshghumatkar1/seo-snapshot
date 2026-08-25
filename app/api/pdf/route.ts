import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/schema'
import { buildCanonicalReportPdf } from '@/lib/pdf/buildCanonicalReportPdf'
import { getArchivedReportPdf } from '@/lib/db/reportArchive'

export const maxDuration = 60
export const runtime = 'nodejs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, websiteUrl, sections, reportType, archiveId } = body

    const config = await getConfig()
    if (config.requireEmailForPDF && !email?.trim() && !archiveId) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Prefer the exact archived artifact when available (same bytes as Admin).
    if (typeof archiveId === 'string' && UUID_RE.test(archiveId)) {
      const archived = await getArchivedReportPdf(archiveId)
      if (!archived) {
        return NextResponse.json({ error: 'Archived PDF not found' }, { status: 404 })
      }
      return new NextResponse(new Uint8Array(archived.bytes), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${archived.filename.replace(/"/g, '')}"`,
          'Cache-Control': 'private, no-store',
          'X-PDF-Source': 'archive',
        },
      })
    }

    if (!websiteUrl || !sections) {
      return NextResponse.json(
        { error: 'Report data is missing.' },
        { status: 400 }
      )
    }

    const pdf = await buildCanonicalReportPdf({
      websiteUrl,
      reportType: reportType === 'detailed' ? 'detailed' : 'snapshot',
      sections,
      reportVersion:
        typeof sections.reportVersion === 'number'
          ? (sections.reportVersion as 2 | 3)
          : undefined,
    })

    return new NextResponse(new Uint8Array(pdf.bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdf.filename.replace(/"/g, '')}"`,
        'Cache-Control': 'private, no-store',
        'X-PDF-Source': 'generated',
      },
    })
  } catch (err) {
    console.error('[API/pdf]', err)
    return NextResponse.json(
      { error: 'PDF generation failed.' },
      { status: 500 }
    )
  }
}
