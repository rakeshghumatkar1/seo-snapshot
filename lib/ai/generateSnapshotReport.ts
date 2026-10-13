import { generateWithAI } from './provider'
import {
  SNAPSHOT_SYSTEM_PROMPT,
  buildSnapshotPrompt,
  buildSnapshotRepairSuffix,
} from './prompts/snapshotPrompt'
import { isValidSnapshotV3Prompt } from './prompts/promptValidation'
import {
  SNAPSHOT_SECTION_MARKERS_V3,
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

function extractSnapshotBodies(raw: string): Map<string, string> {
  const positions = SNAPSHOT_SECTION_MARKERS_V3
    .map(marker => ({ marker, index: raw.indexOf(marker) }))
    .filter(item => item.index >= 0)
    .sort((a, b) => a.index - b.index)

  const bodies = new Map<string, string>()
  for (let i = 0; i < positions.length; i++) {
    const current = positions[i]
    const next = positions[i + 1]
    const start = current.index + current.marker.length
    const end = next ? next.index : raw.length
    const body = raw.slice(start, end).trim()
    if (body) bodies.set(current.marker, body)
  }
  return bodies
}

/**
 * Merge a targeted repair response into the original Snapshot while preserving
 * every valid original section. Returns null when any requested repair section
 * is still absent or empty.
 */
export function mergeSnapshotRepairSections(
  original: string,
  repair: string,
  missingMarkers: string[]
): string | null {
  const originalBodies = extractSnapshotBodies(original)
  const repairBodies = extractSnapshotBodies(repair)

  for (const marker of missingMarkers) {
    const repairedBody = repairBodies.get(marker)
    if (!repairedBody) return null
    originalBodies.set(marker, repairedBody)
  }

  if (SNAPSHOT_SECTION_MARKERS_V3.some(marker => !originalBodies.get(marker))) {
    return null
  }

  return SNAPSHOT_SECTION_MARKERS_V3
    .map(marker => `${marker}\n${originalBodies.get(marker)}`)
    .join('\n\n')
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
    console.log('[Snapshot] Requesting targeted section repair')

    const repairPrompt =
      baseUserPrompt + buildSnapshotRepairSuffix(initialCheck.missing)

    const second = await generateWithAI({
      prompt: repairPrompt,
      systemPrompt,
    })

    if (!second.success || !second.text) {
      console.error('[Snapshot] Targeted repair generation failed:', second.error)
      return null
    }

    const merged = mergeSnapshotRepairSections(
      rawText,
      second.text,
      initialCheck.missing
    )

    if (!merged) {
      console.error(
        '[Snapshot] Targeted repair did not return every missing marker:',
        initialCheck.missing.join(', ')
      )
      return null
    }

    rawText = merged
    const repairCheck = validateSnapshotMarkers(rawText)
    if (!repairCheck.valid) {
      console.error(
        '[Snapshot] Auto-repair merge failed; missing markers:',
        repairCheck.missing.join(', ')
      )
      return null
    }

    console.log('[Snapshot] Targeted auto-repair succeeded')
  }

  const sections = parseSnapshotReportV3(rawText)
  if (!sections) {
    console.error('[Snapshot] V3 parsing failed')
    return null
  }

  return { sections, raw: rawText, reportVersion: 3 }
}
