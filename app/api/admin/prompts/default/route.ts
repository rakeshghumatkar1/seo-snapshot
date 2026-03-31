import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'

export async function GET(req: NextRequest) {
  const auth = await isAdminAuthenticated()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')

  if (key === 'snapshot_system_prompt') {
    const { SNAPSHOT_SYSTEM_PROMPT } = await import('@/lib/ai/prompts/snapshotPrompt')
    return NextResponse.json({ content: SNAPSHOT_SYSTEM_PROMPT })
  }

  if (key === 'detailed_system_prompt') {
    const { DETAILED_SYSTEM_PROMPT } = await import('@/lib/ai/prompts/detailedPrompt')
    return NextResponse.json({ content: DETAILED_SYSTEM_PROMPT })
  }

  return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
}
