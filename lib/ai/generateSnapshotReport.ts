import { generateWithAI } from './provider'
import {
  SNAPSHOT_SYSTEM_PROMPT,
  buildSnapshotPrompt,
} from './prompts/snapshotPrompt'
import { parseSnapshotReport } from './parseReport'
import { fetchWebsiteContent } from './fetchWebsite'
import type { SnapshotSections } from '@/types/report'

export async function generateSnapshotReport(
  websiteUrl: string
): Promise<{
  sections: SnapshotSections
  raw?: string
} | null> {

  console.log('[Snapshot] Fetching website:', websiteUrl)

  const websiteContent = await fetchWebsiteContent(
    websiteUrl
  )

  const pagesFound =
    1 + websiteContent.additionalPages.length

  console.log('[Snapshot] Pages collected:', pagesFound)

  // Build content context for prompt
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

  const prompt = buildSnapshotPrompt(
    websiteUrl,
    contentContext
  )

  const result = await generateWithAI({
    prompt,
    systemPrompt: SNAPSHOT_SYSTEM_PROMPT,
  })

  if (!result.success || !result.text) {
    console.error(
      '[Snapshot] Generation failed:', result.error
    )
    return null
  }

  const sections = parseSnapshotReport(result.text)

  if (!sections) {
    console.error('[Snapshot] Parsing failed')
    return null
  }

  return { sections, raw: result.text }
}
