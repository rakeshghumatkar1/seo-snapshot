import { generateWithAI } from './provider'
import {
  SNAPSHOT_SYSTEM_PROMPT,
  buildSnapshotPrompt,
} from './prompts/snapshotPrompt'
import { isValidSnapshotV3Prompt } from './prompts/promptValidation'
import { parseSnapshotReportV3 } from './parseReportV3'
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

export async function generateSnapshotReport(
  websiteUrl: string
): Promise<{
  sections: SnapshotSections
  raw?: string
  reportVersion: 3
} | null> {
  console.log('[Snapshot] Building V3 evidence package:', websiteUrl)

  const evidence = await buildWebsiteEvidencePackage(websiteUrl, { depth: 'snapshot' })
  console.log('[Snapshot] Pages reviewed:', evidence.analysisCoverage.pagesReviewed)

  const evidenceContext = formatEvidenceForAI(evidence, 'snapshot')
  const prompt = buildSnapshotPrompt(websiteUrl, evidenceContext)
  const systemPrompt = await getSnapshotSystemPrompt()

  const result = await generateWithAI({
    prompt,
    systemPrompt,
  })

  if (!result.success || !result.text) {
    console.error('[Snapshot] Generation failed:', result.error)
    return null
  }

  const sections = parseSnapshotReportV3(result.text)
  if (!sections) {
    console.error('[Snapshot] V3 parsing failed')
    return null
  }

  return { sections, raw: result.text, reportVersion: 3 }
}
