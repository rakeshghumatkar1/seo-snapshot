import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { dbQuery } from '@/lib/db/client'

export async function GET(req: NextRequest) {
  const auth = await isAdminAuthenticated()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')

  if (!key) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 })
  }

  try {
    const rows = await dbQuery(
      `SELECT id, key, content, saved_at FROM prompt_history WHERE key = $1 ORDER BY saved_at DESC LIMIT 10`,
      [key]
    )
    return NextResponse.json({ entries: rows })
  } catch (err) {
    console.error('[Admin/prompts/history GET]', err)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
