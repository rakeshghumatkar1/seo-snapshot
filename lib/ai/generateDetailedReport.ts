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

  // Fetch real website content first
  console.log('[Detailed] Fetching website:', websiteUrl)
  const websiteContent = await fetchWebsiteContent(
    websiteUrl
  )

  if (websiteContent.error) {
    console.warn(
      '[Detailed] Fetch failed, continuing without content:',
      websiteContent.error
    )
  } else {
    console.log(
      '[Detailed] Website fetched, title:',
      websiteContent.title
    )
  }

  // Build prompt with real content
  const prompt = buildDetailedPrompt(
    websiteUrl,
    websiteContent.error ? undefined : websiteContent
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
