import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getActiveShareByToken, touchShareAccess } from '@/lib/db/reportPdfShares'
import { getStoredReportPdf } from '@/lib/db/reportArchive'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const TOKEN_RE = /^[A-Za-z0-9_-]{20,128}$/

const NO_STORE = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
} as const

function notFound(state: string) {
  return new NextResponse('Not Found', {
    status: 404,
    headers: {
      ...NO_STORE,
      'X-Share-State': state,
    },
  })
}

export async function GET(
  req: NextRequest,
  context: { params: { token: string } }
) {
  try {
    // Touch request/headers so Next 14 cannot statically cache this GET
    void req.headers.get('user-agent')
    void headers()

    const token = decodeURIComponent(context.params.token || '').trim()
    if (!TOKEN_RE.test(token)) return notFound('bad-token')

    const share = await getActiveShareByToken(token)
    if (!share) return notFound('inactive-or-missing')
    if (share.is_active !== true || share.revoked_at) return notFound('inactive-guard')

    const pdf = await getStoredReportPdf(share.report_id)
    if (!pdf) return notFound('pdf-missing')

    // Best-effort access tracking — do not fail the PDF response
    void touchShareAccess(share.id).catch(() => {})

    const safeName = String(pdf.filename || 'report.pdf').replace(/"/g, '')

    return new NextResponse(new Uint8Array(pdf.bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${safeName}"`,
        ...NO_STORE,
        'X-Share-State': 'active',
      },
    })
  } catch (err) {
    console.error('[share/pdf]', err)
    return notFound('error')
  }
}
