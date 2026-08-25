import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { generateWithAI } from '@/lib/ai/provider'
import { buildWebsiteEvidencePackage } from '@/lib/ai/website/buildEvidencePackage'
import { formatEvidenceForAI } from '@/lib/ai/website/formatEvidenceForAI'
import { buildSnapshotPrompt } from '@/lib/ai/prompts/snapshotPrompt'
import { buildDetailedPrompt } from '@/lib/ai/prompts/detailedPrompt'

function extractPreview(text: string, preferredKeys: string[]): string {
  for (const key of preferredKeys) {
    const marker = key + ':'
    const start = text.indexOf(marker)
    if (start === -1) continue
    const after = text.slice(start + marker.length)
    const next = after.match(/\n[A-Z][A-Z_]+:/)
    return (next ? after.slice(0, next.index) : after).trim()
  }
  return text.trim().slice(0, 1200)
}

export async function POST(req: NextRequest) {
  const auth = await isAdminAuthenticated()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { key, content, url } = body

    if (!key || typeof content !== 'string' || !url) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const isDetailed = key === 'detailed_system_prompt'
    const evidence = await buildWebsiteEvidencePackage(url)
    const evidenceContext = formatEvidenceForAI(
      evidence,
      isDetailed ? 'detailed' : 'snapshot'
    )

    const prompt = isDetailed
      ? buildDetailedPrompt(url, evidenceContext)
      : buildSnapshotPrompt(url, evidenceContext)

    const result = await generateWithAI({
      prompt,
      systemPrompt: content,
      reportType: isDetailed ? 'detailed' : 'snapshot',
    })

    if (!result.success || !result.text) {
      return NextResponse.json(
        { error: result.error || 'AI generation failed' },
        { status: 500 }
      )
    }

    const introduction = extractPreview(
      result.text,
      isDetailed
        ? ['EXECUTIVE_BUSINESS_ASSESSMENT', 'INTRODUCTION']
        : ['BUSINESS_CUSTOMER_UNDERSTANDING', 'INTRODUCTION']
    )

    return NextResponse.json({ introduction })
  } catch (err: any) {
    console.error('[Admin/prompts/test POST]', err)
    return NextResponse.json({ error: err?.message || 'Test failed' }, { status: 500 })
  }
}
