import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { ensureReportPDF } from '@/lib/db/reportArchive'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: 'Invalid report id' }, { status: 400 })
  }

  try {
    const archived = await ensureReportPDF(params.id)
    if (!archived) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const download = new URL(req.url).searchParams.get('download') === '1'
    const disposition = download ? 'attachment' : 'inline'

    return new NextResponse(new Uint8Array(archived.bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${archived.filename.replace(/"/g, '')}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    console.error('[Admin/report PDF]', err)
    return NextResponse.json({ error: 'Failed to prepare PDF' }, { status: 500 })
  }
}
