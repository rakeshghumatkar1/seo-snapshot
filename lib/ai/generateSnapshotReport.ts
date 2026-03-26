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

  // Fetch real website content first
  console.log('[Snapshot] Fetching website:', websiteUrl)
  const websiteContent = await fetchWebsiteContent(
    websiteUrl
  )

  if (websiteContent.error) {
    console.warn(
      '[Snapshot] Fetch failed, continuing without content:',
      websiteContent.error
    )
  } else {
    console.log(
      '[Snapshot] Website fetched, title:',
      websiteContent.title
    )
  }

  // Build prompt with real content
  const prompt = buildSnapshotPrompt(
    websiteUrl,
    websiteContent.error ? undefined : websiteContent
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
