import { generateWithAI } from './provider'
import {
  SNAPSHOT_SYSTEM_PROMPT,
  buildSnapshotPrompt,
} from './prompts/snapshotPrompt'
import { parseSnapshotReport } from './parseReport'
import { fetchWebsiteContent } from './fetchWebsite'
import { dbQuery } from '@/lib/db/client'
import type { SnapshotSections } from '@/types/report'

async function getSystemPrompt(key: string, fallback: string): Promise<string> {
  try {
    const rows = await dbQuery(
      `SELECT content FROM prompts WHERE key = $1`,
      [key]
    )
    const dbPrompt = rows.length > 0 ? rows[0].content : null
    console.log('[Prompt] DB value:', dbPrompt?.substring(0, 50))
    if (dbPrompt) {
      console.log('[Prompt] Source: DB')
      return dbPrompt
    }
  } catch (err) {
    console.error('[Prompt] DB query error:', err)
  }
  console.log('[Prompt] Source: hardcoded')
  return fallback
}

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

  const systemPrompt = await getSystemPrompt('snapshot_system_prompt', SNAPSHOT_SYSTEM_PROMPT)

  const result = await generateWithAI({
    prompt,
    systemPrompt,
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
