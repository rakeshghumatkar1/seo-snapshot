import { generateWithAI } from '@/lib/ai/provider'
import {
  ANONYMIZE_REPAIR_SYSTEM_PROMPT,
  ANONYMIZE_SYSTEM_PROMPT,
  PRIVACY_AUDIT_SYSTEM_PROMPT,
  buildAnonymizeRepairUserPrompt,
  buildAnonymizeUserPrompt,
  buildPrivacyAuditUserPrompt,
} from '@/lib/ai/prompts/anonymizePublicSample'
import { runDeterministicPrivacyScan, scanSectionsForIdentifiers } from './privacyScan'
import { parseJsonObject, validateAnonymizedStructure } from './structure'
import { normalizeAnonymizedBusinessReferences } from './normalizeBusinessReferences'
import { applyValidatedPrivacyAudit } from './privacyAuditValidate'
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

/**
 * Prepare the EXACT final text that will be saved, then privacy-audit that text.
 * Order: deterministic cleanup → business-ref normalize → cleanup again →
 * normalize → residual detect → AI audit on that exact text → validate issues.
 */
export async function finalizeSectionsWithPrivacyAudit(input: {
  sections: Record<string, string>
  genericLabel: string
  businessCategory: string
  publicLocation: string
  originalDomain: string
  websiteUrl: string
  sourceSections: Record<string, string>
  reportType: 'snapshot' | 'detailed'
}): Promise<{
  sections: Record<string, string>
  audit: PrivacyAuditResult
  deterministicPassed: boolean
  discardedIssues: PrivacyIssue[]
}> {
  let sections = input.sections

  let scan = runDeterministicPrivacyScan(sections, input.websiteUrl)
  sections = scan.cleanedSections
  sections = normalizeAnonymizedBusinessReferences(sections, input.genericLabel)

  scan = runDeterministicPrivacyScan(sections, input.websiteUrl)
  sections = scan.cleanedSections
  sections = normalizeAnonymizedBusinessReferences(sections, input.genericLabel)

  const residual = scanSectionsForIdentifiers(sections, input.websiteUrl)
  const deterministicPassed = residual.length === 0

  const rawAudit = normalizeAudit(
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

  const validated = applyValidatedPrivacyAudit(
    rawAudit,
    sections,
    deterministicPassed
  )

  return {
    sections,
    audit: { safe: validated.safe, issues: validated.issues },
    deterministicPassed,
    discardedIssues: validated.discardedIssues,
  }
}

/**
 * Audit-only re-check against CURRENT saved sections (no regeneration).
 * Does not mutate section prose.
 */
export async function recheckSavedSectionsPrivacy(input: {
  sections: Record<string, string>
  genericLabel: string
  businessCategory: string
  publicLocation: string
  originalDomain: string
  websiteUrl: string
  sourceSections: Record<string, string>
  reportType: 'snapshot' | 'detailed'
}): Promise<{
  status: 'ready' | 'needs_review'
  audit: PrivacyAuditResult
  deterministicPassed: boolean
  discardedIssues: PrivacyIssue[]
}> {
  const residual = scanSectionsForIdentifiers(input.sections, input.websiteUrl)
  const deterministicPassed = residual.length === 0

  const rawAudit = normalizeAudit(
    await runPrivacyAudit({
      genericLabel: input.genericLabel,
      businessCategory: input.businessCategory,
      publicLocation: input.publicLocation,
      originalDomain: input.originalDomain,
      originalWebsiteUrl: input.websiteUrl,
      sourceSections: input.sourceSections,
      candidateSections: input.sections,
      reportType: input.reportType,
    })
  )

  const validated = applyValidatedPrivacyAudit(
    rawAudit,
    input.sections,
    deterministicPassed
  )

  const audit = { safe: validated.safe, issues: validated.issues }
  const status: 'ready' | 'needs_review' =
    audit.safe && deterministicPassed ? 'ready' : 'needs_review'

  return {
    status,
    audit,
    deterministicPassed,
    discardedIssues: validated.discardedIssues,
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
  discardedIssues?: PrivacyIssue[]
}

/**
 * Bounded AI workflow:
 * generation (+ optional structural repair) + finalize(cleanup→normalize→scan→audit)
 * optional privacy repair + finalize again
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
      userPrompt:
        buildAnonymizeUserPrompt({
          genericLabel: input.genericLabel,
          businessCategory: input.businessCategory,
          publicLocation: input.publicLocation,
          reportType: input.reportType,
          sectionKeys: input.expectedKeys,
          sourceSections: input.sourceSections,
        }) +
        `\n\nPREVIOUS ATTEMPT FAILED STRUCTURAL VALIDATION:\n${first.error || 'invalid'}`,
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

  aiCalls += 1
  let finalized = await finalizeSectionsWithPrivacyAudit({
    sections: first.sections,
    genericLabel: input.genericLabel,
    businessCategory: input.businessCategory,
    publicLocation: input.publicLocation,
    originalDomain: input.originalDomain,
    websiteUrl: input.websiteUrl,
    sourceSections: input.sourceSections,
    reportType: input.reportType,
  })

  if (finalized.audit.safe && finalized.deterministicPassed) {
    console.log('[AnonymizedSample] Privacy audit passed')
    return {
      ok: true,
      status: 'ready',
      sections: finalized.sections,
      audit: finalized.audit,
      deterministicPassed: true,
      aiCalls,
      discardedIssues: finalized.discardedIssues,
    }
  }

  if (!finalized.audit.safe || !finalized.deterministicPassed) {
    console.log('[AnonymizedSample] Privacy audit failed — one repair attempt')
    aiCalls += 1
    const repaired = await callAnonymizeOnce({
      systemPrompt: ANONYMIZE_REPAIR_SYSTEM_PROMPT,
      userPrompt: buildAnonymizeRepairUserPrompt({
        genericLabel: input.genericLabel,
        businessCategory: input.businessCategory,
        publicLocation: input.publicLocation,
        sectionKeys: input.expectedKeys,
        candidateSections: finalized.sections,
        issues: finalized.audit.issues.length
          ? finalized.audit.issues
          : [
              {
                section: '_audit',
                text: '',
                reason: 'Deterministic privacy identifiers remain',
              },
            ],
      }),
      reportType: input.reportType,
      expectedKeys: input.expectedKeys,
      sourceSections: input.sourceSections,
    })

    if (repaired.sections) {
      aiCalls += 1
      finalized = await finalizeSectionsWithPrivacyAudit({
        sections: repaired.sections,
        genericLabel: input.genericLabel,
        businessCategory: input.businessCategory,
        publicLocation: input.publicLocation,
        originalDomain: input.originalDomain,
        websiteUrl: input.websiteUrl,
        sourceSections: input.sourceSections,
        reportType: input.reportType,
      })
    }
  }

  if (finalized.audit.safe && finalized.deterministicPassed) {
    console.log('[AnonymizedSample] Privacy audit passed after repair')
    return {
      ok: true,
      status: 'ready',
      sections: finalized.sections,
      audit: finalized.audit,
      deterministicPassed: true,
      aiCalls,
      discardedIssues: finalized.discardedIssues,
    }
  }

  if (!finalized.deterministicPassed) {
    return {
      ok: false,
      status: 'needs_review',
      sections: finalized.sections,
      audit: finalized.audit,
      deterministicPassed: false,
      error: 'Deterministic privacy scan still found identifiers',
      aiCalls,
      discardedIssues: finalized.discardedIssues,
    }
  }

  console.log('[AnonymizedSample] Privacy audit needs review')
  return {
    ok: true,
    status: 'needs_review',
    sections: finalized.sections,
    audit: finalized.audit,
    deterministicPassed: finalized.deterministicPassed,
    aiCalls,
    discardedIssues: finalized.discardedIssues,
  }
}
