import { NextRequest, NextResponse } from 'next/server'
import { getActiveShareByToken, touchShareAccess } from '@/lib/db/reportPdfShares'
import { getStoredReportPdf } from '@/lib/db/reportArchive'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TOKEN_RE = /^[A-Za-z0-9_-]{20,128}$/

function notFound() {
  return new NextResponse('Not Found', {
    status: 404,
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  })
}

export async function GET(
  _req: NextRequest,
  context: { params: { token: string } }
) {
  try {
    const token = decodeURIComponent(context.params.token || '').trim()
    if (!TOKEN_RE.test(token)) return notFound()

    const share = await getActiveShareByToken(token)
    if (!share) return notFound()

    const pdf = await getStoredReportPdf(share.report_id)
    if (!pdf) return notFound()

    // Best-effort access tracking — do not fail the PDF response
    void touchShareAccess(share.id).catch(() => {})

    const safeName = String(pdf.filename || 'report.pdf').replace(/"/g, '')

    return new NextResponse(new Uint8Array(pdf.bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${safeName}"`,
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
      },
    })
  } catch (err) {
    console.error('[share/pdf]', err)
    return notFound()
  }
}
