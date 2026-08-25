import { generateWithAI } from '@/lib/ai/provider'
import {
  ANONYMIZE_REPAIR_SYSTEM_PROMPT,
  ANONYMIZE_SYSTEM_PROMPT,
  PRIVACY_AUDIT_SYSTEM_PROMPT,
  buildAnonymizeRepairUserPrompt,
  buildAnonymizeUserPrompt,
  buildPrivacyAuditUserPrompt,
} from '@/lib/ai/prompts/anonymizePublicSample'
import { runDeterministicPrivacyScan } from './privacyScan'
import { parseJsonObject, validateAnonymizedStructure } from './structure'
import { normalizeAnonymizedBusinessReferences } from './normalizeBusinessReferences'
import type { PrivacyAuditResult, PrivacyIssue } from './types'

async function callAnonymizeOnce(input: {
  systemPrompt: string
  userPrompt: string
  reportType: 'snapshot' | 'detailed'
  expectedKeys: string[]
  sourceSections: Record<string, string>
}): Promise<{ sections: Record<string, string> | null; error?: string; raw?: string }> {
  const ai = await generateWithAI({
    systemPrompt: input.systemPrompt,
    prompt: input.userPrompt,
    reportType: input.reportType,
  })
  if (!ai.success || !ai.text) {
    return { sections: null, error: ai.error || 'AI anonymisation failed' }
  }

  const parsed = parseJsonObject(ai.text)
  const validation = validateAnonymizedStructure(
    parsed,
    input.expectedKeys,
    input.sourceSections
  )
  if (!validation.valid || !validation.sections) {
    return {
      sections: null,
      error: validation.errors.join('; ') || 'Structural validation failed',
      raw: ai.text.slice(0, 400),
    }
  }
  return { sections: validation.sections }
}

export async function runPrivacyAudit(input: {
  genericLabel: string
  businessCategory: string
  publicLocation: string
  originalDomain: string
  originalWebsiteUrl: string
  sourceSections: Record<string, string>
  candidateSections: Record<string, string>
  reportType: 'snapshot' | 'detailed'
}): Promise<PrivacyAuditResult> {
  const ai = await generateWithAI({
    systemPrompt: PRIVACY_AUDIT_SYSTEM_PROMPT,
    prompt: buildPrivacyAuditUserPrompt(input),
    reportType: input.reportType,
  })

  if (!ai.success || !ai.text) {
    return {
      safe: false,
      issues: [
        {
          section: '_audit',
          text: '',
          reason: ai.error || 'Privacy audit AI call failed',
        },
      ],
    }
  }

  const parsed = parseJsonObject(ai.text) as PrivacyAuditResult | null
  if (!parsed || typeof parsed.safe !== 'boolean') {
    return {
      safe: false,
      issues: [
        {
          section: '_audit',
          text: '',
          reason: 'Privacy audit returned invalid JSON',
        },
      ],
    }
  }

  const issues: PrivacyIssue[] = Array.isArray(parsed.issues)
    ? parsed.issues
        .filter((i) => i && typeof i === 'object')
        .map((i: any) => ({
          section: String(i.section || ''),
          text: String(i.text || '').slice(0, 280),
          reason: String(i.reason || ''),
        }))
    : []

  if (parsed.safe) return { safe: true, issues: [] }
  return {
    safe: false,
    issues: issues.length
      ? issues
      : [{ section: '_audit', text: '', reason: 'Marked unsafe without issues' }],
  }
}

function normalizeAudit(result: PrivacyAuditResult): PrivacyAuditResult {
  if (result.safe) return { safe: true, issues: [] }
  return {
    safe: false,
    issues: result.issues.length
      ? result.issues
      : [{ section: '_audit', text: '', reason: 'Marked unsafe' }],
  }
}

export type AnonymizeGenerationResult = {
  ok: boolean
  status: 'draft' | 'ready' | 'needs_review' | 'failed'
  sections: Record<string, string> | null
  audit: PrivacyAuditResult | null
  deterministicPassed: boolean
  error?: string
  aiCalls: number
}

/**
 * Bounded AI workflow:
 * generation (+ optional structural repair) + audit (+ optional privacy repair + final audit)
 * Max anonymisation generation/repair calls: 2
 * Max audits: 2
 */
export async function generateAnonymizedSampleContent(input: {
  genericLabel: string
  businessCategory: string
  publicLocation: string
  reportType: 'snapshot' | 'detailed'
  expectedKeys: string[]
  sourceSections: Record<string, string>
  websiteUrl: string
  originalDomain: string
}): Promise<AnonymizeGenerationResult> {
  let aiCalls = 0

  console.log('[AnonymizedSample] Generation started')

  aiCalls += 1
  let first = await callAnonymizeOnce({
    systemPrompt: ANONYMIZE_SYSTEM_PROMPT,
    userPrompt: buildAnonymizeUserPrompt({
      genericLabel: input.genericLabel,
      businessCategory: input.businessCategory,
      publicLocation: input.publicLocation,
      reportType: input.reportType,
      sectionKeys: input.expectedKeys,
      sourceSections: input.sourceSections,
    }),
    reportType: input.reportType,
    expectedKeys: input.expectedKeys,
    sourceSections: input.sourceSections,
  })

  if (!first.sections) {
    console.log('[AnonymizedSample] Structural validation failed — retrying once')
    aiCalls += 1
    first = await callAnonymizeOnce({
      systemPrompt: ANONYMIZE_SYSTEM_PROMPT,
      userPrompt: buildAnonymizeUserPrompt({
        genericLabel: input.genericLabel,
        businessCategory: input.businessCategory,
        publicLocation: input.publicLocation,
        reportType: input.reportType,
        sectionKeys: input.expectedKeys,
        sourceSections: input.sourceSections,
      }) + `\n\nPREVIOUS ATTEMPT FAILED STRUCTURAL VALIDATION:\n${first.error || 'invalid'}`,
      reportType: input.reportType,
      expectedKeys: input.expectedKeys,
      sourceSections: input.sourceSections,
    })
  }

  if (!first.sections) {
    return {
      ok: false,
      status: 'failed',
      sections: null,
      audit: null,
      deterministicPassed: false,
      error: first.error || 'Structural validation failed',
      aiCalls,
    }
  }

  console.log('[AnonymizedSample] Structural validation passed')

  let sections = first.sections
  let scan = runDeterministicPrivacyScan(sections, input.websiteUrl)
  sections = scan.cleanedSections

  if (scan.passed) {
    console.log('[AnonymizedSample] Deterministic privacy scan passed')
  } else {
    console.log('[AnonymizedSample] Deterministic privacy scan cleaned residual identifiers')
    scan = runDeterministicPrivacyScan(sections, input.websiteUrl)
    sections = scan.cleanedSections
  }

  aiCalls += 1
  let audit = normalizeAudit(
    await runPrivacyAudit({
      genericLabel: input.genericLabel,
      businessCategory: input.businessCategory,
      publicLocation: input.publicLocation,
      originalDomain: input.originalDomain,
      originalWebsiteUrl: input.websiteUrl,
      sourceSections: input.sourceSections,
      candidateSections: sections,
      reportType: input.reportType,
    })
  )

  if (audit.safe && scan.passed) {
    console.log('[AnonymizedSample] Privacy audit passed')
    return {
      ok: true,
      status: 'ready',
      sections: normalizeAnonymizedBusinessReferences(sections, input.genericLabel),
      audit,
      deterministicPassed: true,
      aiCalls,
    }
  }

  if (!audit.safe) {
    console.log('[AnonymizedSample] Privacy audit failed — one repair attempt')
    // Only if we still have generation budget (max 2 generation/repair calls used so far for structure)
    // Spec: generation + audit; if repair: ONE repair + ONE final audit
    // We've used 1-2 for generation. Repair is separate.
    aiCalls += 1
    const repaired = await callAnonymizeOnce({
      systemPrompt: ANONYMIZE_REPAIR_SYSTEM_PROMPT,
      userPrompt: buildAnonymizeRepairUserPrompt({
        genericLabel: input.genericLabel,
        businessCategory: input.businessCategory,
        publicLocation: input.publicLocation,
        sectionKeys: input.expectedKeys,
        candidateSections: sections,
        issues: audit.issues,
      }),
      reportType: input.reportType,
      expectedKeys: input.expectedKeys,
      sourceSections: input.sourceSections,
    })

    if (repaired.sections) {
      sections = repaired.sections
      scan = runDeterministicPrivacyScan(sections, input.websiteUrl)
      sections = scan.cleanedSections
      aiCalls += 1
      audit = normalizeAudit(
        await runPrivacyAudit({
          genericLabel: input.genericLabel,
          businessCategory: input.businessCategory,
          publicLocation: input.publicLocation,
          originalDomain: input.originalDomain,
          originalWebsiteUrl: input.websiteUrl,
          sourceSections: input.sourceSections,
          candidateSections: sections,
          reportType: input.reportType,
        })
      )
    }
  }

  sections = normalizeAnonymizedBusinessReferences(sections, input.genericLabel)

  if (audit.safe && scan.passed) {
    console.log('[AnonymizedSample] Privacy audit passed after repair')
    return {
      ok: true,
      status: 'ready',
      sections,
      audit,
      deterministicPassed: true,
      aiCalls,
    }
  }

  if (!scan.passed) {
    return {
      ok: false,
      status: 'needs_review',
      sections,
      audit,
      deterministicPassed: false,
      error: 'Deterministic privacy scan still found identifiers',
      aiCalls,
    }
  }

  console.log('[AnonymizedSample] Privacy audit needs review')
  return {
    ok: true,
    status: 'needs_review',
    sections,
    audit,
    deterministicPassed: scan.passed,
    aiCalls,
  }
}
