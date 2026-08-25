import { generateWithAI } from './provider'
import {
  DETAILED_SYSTEM_PROMPT,
  buildDetailedPrompt,
  buildDetailedRepairSuffix,
} from './prompts/detailedPrompt'
import { isValidDetailedV3Prompt } from './prompts/promptValidation'
import {
  parseDetailedReportV3,
  validateDetailedMarkers,
} from './parseReportV3'
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

/**
 * Decide whether a raw AI response should trigger the one-time section-completeness repair.
 * Exported for structural smoke tests (no network / no AI).
 */
export function shouldRetryDetailedForMissingMarkers(raw: string): {
  retry: boolean
  missing: string[]
} {
  const check = validateDetailedMarkers(raw)
  return {
    retry: !check.valid,
    missing: check.missing,
  }
}

export async function generateDetailedReport(
  websiteUrl: string
): Promise<{
  sections: DetailedSections
  raw?: string
  reportVersion: 3
} | null> {
  console.log('[Detailed] Building V3 evidence package:', websiteUrl)

  const evidence = await buildWebsiteEvidencePackage(websiteUrl)
  console.log('[Detailed] Pages analysed:', evidence.coverage.analysedPages)

  const evidenceContext = formatEvidenceForAI(evidence, 'detailed')
  const baseUserPrompt = buildDetailedPrompt(websiteUrl, evidenceContext)
  const systemPrompt = await getDetailedSystemPrompt()

  const first = await generateWithAI({
    prompt: baseUserPrompt,
    systemPrompt,
    reportType: 'detailed',
  })

  if (!first.success || !first.text) {
    console.error('[Detailed] Generation failed:', first.error)
    return null
  }

  let rawText = first.text
  const initialCheck = shouldRetryDetailedForMissingMarkers(rawText)

  if (initialCheck.retry) {
    console.warn(
      '[Detailed] Initial generation missing markers:',
      initialCheck.missing.join(', ')
    )
    console.log('[Detailed] Retrying generation for section completeness')

    const repairPrompt =
      baseUserPrompt + buildDetailedRepairSuffix(initialCheck.missing)

    const second = await generateWithAI({
      prompt: repairPrompt,
      systemPrompt,
      reportType: 'detailed',
    })

    if (!second.success || !second.text) {
      console.error('[Detailed] Auto-repair generation failed:', second.error)
      return null
    }

    rawText = second.text
    const repairCheck = validateDetailedMarkers(rawText)
    if (!repairCheck.valid) {
      console.error(
        '[Detailed] Auto-repair failed; missing markers:',
        repairCheck.missing.join(', ')
      )
      return null
    }

    console.log('[Detailed] Auto-repair succeeded')
  }

  const sections = parseDetailedReportV3(rawText)
  if (!sections) {
    console.error('[Detailed] V3 parsing failed')
    return null
  }

  return { sections, raw: rawText, reportVersion: 3 }
}
