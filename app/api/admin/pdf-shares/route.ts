import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import {
  countActiveShares,
  createOrGetPdfShare,
  getActiveShareForReport,
  listActiveShareTokens,
  listActiveShareTokensForReports,
  revokeAllActiveShares,
  revokeShareForReport,
  revokeSharesForReports,
} from '@/lib/db/reportPdfShares'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function bustShareCaches(tokens: string[]) {
  for (const token of tokens) {
    if (!token) continue
    try {
      revalidatePath(`/share/${token}`)
    } catch {
      // best-effort; route itself is force-dynamic + no-store
    }
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_BATCH = 100

function publicShareUrl(req: NextRequest, token: string) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || ''
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  if (host) return `${proto}://${host}/share/${token}`
  return `/share/${token}`
}

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reportId = new URL(req.url).searchParams.get('reportId') || ''
  if (reportId && !UUID_RE.test(reportId)) {
    return NextResponse.json({ error: 'Invalid report id' }, { status: 400 })
  }

  const activeShareCount = await countActiveShares()

  if (!reportId) {
    return NextResponse.json({ activeShareCount })
  }

  const share = await getActiveShareForReport(reportId)
  if (!share) {
    return NextResponse.json({
      active: false,
      shareStatus: 'private',
      activeShareCount,
    })
  }

  return NextResponse.json({
    active: true,
    shareStatus: 'shared',
    shareToken: share.share_token,
    publicUrl: publicShareUrl(req, share.share_token),
    createdAt: share.created_at,
    accessCount: share.access_count,
    activeShareCount,
  })
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const action = String(body.action || '')

  if (action === 'create') {
    const reportId = String(body.reportId || '')
    if (!UUID_RE.test(reportId)) {
      return NextResponse.json({ error: 'Invalid report id' }, { status: 400 })
    }
    const result = await createOrGetPdfShare(reportId)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({
      success: true,
      created: result.created,
      shareStatus: 'shared',
      shareToken: result.share.share_token,
      publicUrl: publicShareUrl(req, result.share.share_token),
      createdAt: result.share.created_at,
      activeShareCount: await countActiveShares(),
    })
  }

  if (action === 'revoke') {
    const reportId = String(body.reportId || '')
    if (!UUID_RE.test(reportId)) {
      return NextResponse.json({ error: 'Invalid report id' }, { status: 400 })
    }
    const tokens = await listActiveShareTokensForReports([reportId])
    const revoked = await revokeShareForReport(reportId)
    bustShareCaches(tokens)
    return NextResponse.json({
      success: true,
      revoked,
      shareStatus: 'private',
      activeShareCount: await countActiveShares(),
    })
  }

  if (action === 'revoke_selected') {
    const reportIds = Array.isArray(body.reportIds)
      ? body.reportIds
          .filter((id: unknown): id is string => typeof id === 'string' && UUID_RE.test(id))
          .slice(0, MAX_BATCH)
      : []
    if (!reportIds.length) {
      return NextResponse.json({ error: 'No valid report ids supplied' }, { status: 400 })
    }
    const tokens = await listActiveShareTokensForReports(reportIds)
    const revoked = await revokeSharesForReports(reportIds)
    bustShareCaches(tokens)
    return NextResponse.json({
      success: true,
      revoked,
      activeShareCount: await countActiveShares(),
    })
  }

  if (action === 'revoke_all') {
    const tokens = await listActiveShareTokens()
    const revoked = await revokeAllActiveShares()
    bustShareCaches(tokens)
    return NextResponse.json({
      success: true,
      revoked,
      activeShareCount: 0,
    })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
