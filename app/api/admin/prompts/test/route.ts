import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { generateWithAI } from '@/lib/ai/provider'
import { fetchWebsiteContent } from '@/lib/ai/fetchWebsite'
import { buildSnapshotPrompt } from '@/lib/ai/prompts/snapshotPrompt'
import { buildDetailedPrompt } from '@/lib/ai/prompts/detailedPrompt'

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

    const websiteContent = await fetchWebsiteContent(url)
    const pagesFound = 1 + websiteContent.additionalPages.length

    const contentContext = websiteContent.allText
      ? `
WEBSITE RESEARCH DATA:
Domain: ${websiteContent.domain}
Pages analyzed: ${pagesFound} page(s) found

${websiteContent.allText}

END OF WEBSITE DATA

Use the above real website content to make your report specific to this business.
Base all observations on what is actually visible in the content above.
`
      : ''

    const prompt =
      key === 'detailed_system_prompt'
        ? buildDetailedPrompt(url, contentContext)
        : buildSnapshotPrompt(url, contentContext)

    const result = await generateWithAI({
      prompt,
      systemPrompt: content,
      reportType: key === 'detailed_system_prompt' ? 'detailed' : 'snapshot',
    })

    if (!result.success || !result.text) {
      return NextResponse.json(
        { error: result.error || 'AI generation failed' },
        { status: 500 }
      )
    }

    const introStart = result.text.indexOf('INTRODUCTION:')
    let introduction: string
    if (introStart !== -1) {
      const afterIntro = result.text.slice(introStart + 'INTRODUCTION:'.length)
      const nextSectionMatch = afterIntro.match(/\n[A-Z][A-Z_]+:/)
      introduction = nextSectionMatch
        ? afterIntro.slice(0, nextSectionMatch.index).trim()
        : afterIntro.trim()
    } else {
      introduction = result.text.trim()
    }

    return NextResponse.json({ introduction })
  } catch (err: any) {
    console.error('[Admin/prompts/test POST]', err)
    return NextResponse.json({ error: err?.message || 'Test failed' }, { status: 500 })
  }
}
