import { generateWithAI } from './provider'
import {
  DETAILED_SYSTEM_PROMPT,
  buildDetailedPrompt,
} from './prompts/detailedPrompt'
import { parseDetailedReport } from './parseReport'
import { fetchWebsiteContent } from './fetchWebsite'
import { dbQuery } from '@/lib/db/client'
import type { DetailedSections } from '@/types/report'

async function getSystemPrompt(key: string, fallback: string): Promise<string> {
  try {
    const rows = await dbQuery(
      `SELECT content FROM prompts WHERE key = $1`,
      [key]
    )
    const dbPrompt = rows.length > 0 ? rows[0].content : null
    if (dbPrompt?.trim()) {
      return dbPrompt
    }
  } catch {
    // fall through to default
  }
  return fallback
}

export async function generateDetailedReport(
  websiteUrl: string
): Promise<{
  sections: DetailedSections
  raw?: string
} | null> {

  console.log('[Detailed] Fetching website:', websiteUrl)

  const websiteContent = await fetchWebsiteContent(
    websiteUrl
  )

  const pagesFound =
    1 + websiteContent.additionalPages.length

  console.log('[Detailed] Pages collected:', pagesFound)

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

  const prompt = buildDetailedPrompt(
    websiteUrl,
    contentContext
  )

  const systemPrompt = await getSystemPrompt('detailed_system_prompt', DETAILED_SYSTEM_PROMPT)

  const result = await generateWithAI({
    prompt,
    systemPrompt,
    reportType: 'detailed',
  })

  if (!result.success || !result.text) {
    console.error(
      '[Detailed] Generation failed:', result.error
    )
    return null
  }

  const sections = parseDetailedReport(result.text)

  if (!sections) {
    console.error('[Detailed] Parsing failed')
    return null
  }

  return { sections, raw: result.text }
}
