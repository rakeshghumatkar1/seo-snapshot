import { generateWithAI } from './provider'
import {
  DETAILED_SYSTEM_PROMPT,
  buildDetailedPrompt,
} from './prompts/detailedPrompt'
import { parseDetailedReport } from './parseReport'
import { fetchWebsiteContent } from './fetchWebsite'
import type { DetailedSections } from '@/types/report'

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

  const result = await generateWithAI({
    prompt,
    systemPrompt: DETAILED_SYSTEM_PROMPT,
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
