import { generateWithAI } from './provider'
import {
  DETAILED_SYSTEM_PROMPT,
  buildDetailedPrompt,
} from './prompts/detailedPrompt'
import { isValidDetailedV3Prompt } from './prompts/promptValidation'
import { parseDetailedReportV3 } from './parseReportV3'
import { buildWebsiteEvidencePackage } from './website/buildEvidencePackage'
import { formatEvidenceForAI } from './website/formatEvidenceForAI'
import { dbQuery } from '@/lib/db/client'
import type { DetailedSections } from '@/types/report'

async function getDetailedSystemPrompt(): Promise<string> {
  try {
    const rows = await dbQuery(
      `SELECT content FROM prompts WHERE key = $1`,
      ['detailed_system_prompt']
    )
    const dbPrompt = rows.length > 0 ? rows[0].content : null
    if (dbPrompt?.trim() && isValidDetailedV3Prompt(dbPrompt)) {
      console.log('[Detailed] Prompt source: DB (V3 validated)')
      return dbPrompt
    }
    if (dbPrompt?.trim()) {
      console.warn('[Detailed] Ignoring non-V3 DB prompt; using hardcoded V3')
    }
  } catch (err) {
    console.error('[Detailed] Prompt DB query error:', err)
  }
  console.log('[Detailed] Prompt source: hardcoded V3')
  return DETAILED_SYSTEM_PROMPT
}

export async function generateDetailedReport(
  websiteUrl: string
): Promise<{
  sections: DetailedSections
  raw?: string
  reportVersion: 3
} | null> {
  console.log('[Detailed] Building V3 evidence package:', websiteUrl)

  const evidence = await buildWebsiteEvidencePackage(websiteUrl, { depth: 'detailed' })
  console.log('[Detailed] Pages reviewed:', evidence.analysisCoverage.pagesReviewed)

  const evidenceContext = formatEvidenceForAI(evidence, 'detailed')
  const prompt = buildDetailedPrompt(websiteUrl, evidenceContext)
  const systemPrompt = await getDetailedSystemPrompt()

  const result = await generateWithAI({
    prompt,
    systemPrompt,
    reportType: 'detailed',
  })

  if (!result.success || !result.text) {
    console.error('[Detailed] Generation failed:', result.error)
    return null
  }

  const sections = parseDetailedReportV3(result.text)
  if (!sections) {
    console.error('[Detailed] V3 parsing failed')
    return null
  }

  return { sections, raw: result.text, reportVersion: 3 }
}
