import { generateWithAI } from './provider'
import {
  SNAPSHOT_SYSTEM_PROMPT,
  buildSnapshotPrompt,
  buildSnapshotRepairSuffix,
} from './prompts/snapshotPrompt'
import { isValidSnapshotV3Prompt } from './prompts/promptValidation'
import {
  parseSnapshotReportV3,
  validateSnapshotMarkers,
} from './parseReportV3'
import { buildWebsiteEvidencePackage } from './website/buildEvidencePackage'
import { formatEvidenceForAI } from './website/formatEvidenceForAI'
import { dbQuery } from '@/lib/db/client'
import type { SnapshotSections } from '@/types/report'

async function getSnapshotSystemPrompt(): Promise<string> {
  try {
    const rows = await dbQuery(
      `SELECT content FROM prompts WHERE key = $1`,
      ['snapshot_system_prompt']
    )
    const dbPrompt = rows.length > 0 ? rows[0].content : null
    if (dbPrompt?.trim() && isValidSnapshotV3Prompt(dbPrompt)) {
      console.log('[Snapshot] Prompt source: DB (V3 validated)')
      return dbPrompt
    }
    if (dbPrompt?.trim()) {
      console.warn('[Snapshot] Ignoring non-V3 DB prompt; using hardcoded V3')
    }
  } catch (err) {
    console.error('[Snapshot] Prompt DB query error:', err)
  }
  console.log('[Snapshot] Prompt source: hardcoded V3')
  return SNAPSHOT_SYSTEM_PROMPT
}

/**
 * Decide whether a raw AI response should trigger the one-time section-completeness repair.
 * Exported for structural smoke tests (no network / no AI).
 */
export function shouldRetrySnapshotForMissingMarkers(raw: string): {
  retry: boolean
  missing: string[]
} {
  const check = validateSnapshotMarkers(raw)
  return {
    retry: !check.valid,
    missing: check.missing,
  }
}

export async function generateSnapshotReport(
  websiteUrl: string
): Promise<{
  sections: SnapshotSections
  raw?: string
  reportVersion: 3
} | null> {
  console.log('[Snapshot] Building V3 evidence package:', websiteUrl)

  const evidence = await buildWebsiteEvidencePackage(websiteUrl)
  console.log('[Snapshot] Pages analysed:', evidence.coverage.analysedPages)

  const evidenceContext = formatEvidenceForAI(evidence, 'snapshot')
  const baseUserPrompt = buildSnapshotPrompt(websiteUrl, evidenceContext)
  const systemPrompt = await getSnapshotSystemPrompt()

  const first = await generateWithAI({
    prompt: baseUserPrompt,
    systemPrompt,
  })

  if (!first.success || !first.text) {
    console.error('[Snapshot] Generation failed:', first.error)
    return null
  }

  let rawText = first.text
  const initialCheck = shouldRetrySnapshotForMissingMarkers(rawText)

  if (initialCheck.retry) {
    console.warn(
      '[Snapshot] Initial generation missing markers:',
      initialCheck.missing.join(', ')
    )
    console.log('[Snapshot] Retrying generation for section completeness')

    const repairPrompt =
      baseUserPrompt + buildSnapshotRepairSuffix(initialCheck.missing)

    const second = await generateWithAI({
      prompt: repairPrompt,
      systemPrompt,
    })

    if (!second.success || !second.text) {
      console.error('[Snapshot] Auto-repair generation failed:', second.error)
      return null
    }

    rawText = second.text
    const repairCheck = validateSnapshotMarkers(rawText)
    if (!repairCheck.valid) {
      console.error(
        '[Snapshot] Auto-repair failed; missing markers:',
        repairCheck.missing.join(', ')
      )
      return null
    }

    console.log('[Snapshot] Auto-repair succeeded')
  }

  const sections = parseSnapshotReportV3(rawText)
  if (!sections) {
    console.error('[Snapshot] V3 parsing failed')
    return null
  }

  return { sections, raw: rawText, reportVersion: 3 }
}
