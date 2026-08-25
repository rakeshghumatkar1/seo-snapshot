import { generateWithAI } from '@/lib/ai/provider'
import {
  SAMPLE_METADATA_SYSTEM_PROMPT,
  buildSampleMetadataUserPrompt,
} from '@/lib/ai/prompts/anonymizedSampleMetadata'
import { parseJsonObject } from '@/lib/anonymize/structure'
import { normalizeDomain } from '@/lib/url/normalizeDomain'
import {
  sanitizeSuggestedMetadata,
  type SuggestedSampleMetadata,
} from '@/lib/anonymize/sampleMetadataHelpers'

export type { SuggestedSampleMetadata }
export {
  deriveSlugFromLabel,
  isUnsafeGenericLabel,
  mergeSuggestedMetadata,
  missingMetadataMessages,
  needsMetadataSuggestion,
  sanitizeSuggestedMetadata,
} from '@/lib/anonymize/sampleMetadataHelpers'

export async function suggestAnonymizedSampleMetadata(input: {
  reportType: 'snapshot' | 'detailed'
  websiteUrl: string
  sourceSections: Record<string, string>
}): Promise<{
  ok: boolean
  suggestion: SuggestedSampleMetadata
  aiCalls: number
  error?: string
  raw?: string
}> {
  const hostname = normalizeDomain(input.websiteUrl)
  const ai = await generateWithAI({
    systemPrompt: SAMPLE_METADATA_SYSTEM_PROMPT,
    prompt: buildSampleMetadataUserPrompt({
      reportType: input.reportType,
      privateHostname: hostname,
      sourceSections: input.sourceSections,
    }),
    reportType: 'snapshot',
  })

  if (!ai.success || !ai.text) {
    return {
      ok: false,
      suggestion: { genericLabel: null, businessCategory: null, publicLocation: null },
      aiCalls: 1,
      error: ai.error || 'Metadata suggestion failed',
    }
  }

  const parsed = parseJsonObject(ai.text)
  const suggestion = sanitizeSuggestedMetadata(
    parsed
      ? {
          genericLabel: (parsed as any).genericLabel,
          businessCategory: (parsed as any).businessCategory,
          publicLocation: (parsed as any).publicLocation,
        }
      : null,
    input.websiteUrl
  )

  const ok = Boolean(
    suggestion.genericLabel || suggestion.businessCategory || suggestion.publicLocation
  )

  return {
    ok,
    suggestion,
    aiCalls: 1,
    error: ok ? undefined : 'Could not derive safe metadata from the source report',
    raw: ai.text,
  }
}
