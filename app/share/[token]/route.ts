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
    if (!share) {
      const res = notFound()
      res.headers.set('X-Share-State', 'inactive-or-missing')
      return res
    }
    if (share.is_active !== true || share.revoked_at) {
      const res = notFound()
      res.headers.set('X-Share-State', 'inactive-guard')
      return res
    }

    const pdf = await getStoredReportPdf(share.report_id)
    if (!pdf) {
      const res = notFound()
      res.headers.set('X-Share-State', 'pdf-missing')
      return res
    }

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
        'X-Share-State': 'active',
      },
    })
  } catch (err) {
    console.error('[share/pdf]', err)
    return notFound()
  }
}
