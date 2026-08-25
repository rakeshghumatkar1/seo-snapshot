import { detectIdentifiers } from '@/lib/anonymize/privacyScan'
import { normalizeDomain } from '@/lib/url/normalizeDomain'

export type SuggestedSampleMetadata = {
  genericLabel: string | null
  businessCategory: string | null
  publicLocation: string | null
}

export type CurrentSampleMetadata = {
  genericLabel: string
  businessCategory: string
  publicLocation: string
  slug?: string
}

function cleanText(value: unknown, max = 120): string | null {
  const text = String(value ?? '').trim().replace(/\s+/g, ' ')
  if (!text) return null
  return text.slice(0, max)
}

export function deriveSlugFromLabel(label: string): string {
  const base = String(label || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return base || `sample-report-${Date.now().toString(36)}`
}

function hostTokens(websiteUrl: string): string[] {
  const host = normalizeDomain(websiteUrl)
  if (!host) return []
  const bare = host.toLowerCase()
  const noTld = bare.replace(/\.[a-z]{2,}$/i, '')
  const parts = noTld.split(/[.-]/).filter((p) => p.length >= 3)
  return Array.from(new Set([bare, `www.${bare}`, noTld, ...parts]))
}

/** Reject labels that leak source identity or contact details. */
export function isUnsafeGenericLabel(label: string | null | undefined, websiteUrl: string): boolean {
  const text = String(label || '').trim()
  if (!text) return true
  if (text.length < 4) return true

  const hits = detectIdentifiers(text, websiteUrl)
  if (hits.length > 0) return true

  const lower = text.toLowerCase()
  for (const token of hostTokens(websiteUrl)) {
    if (!token) continue
    if (lower.includes(token.toLowerCase())) return true
  }

  if (/\b(ltd|llc|inc|corp|gmbh|pvt)\b\.?$/i.test(text) && text.split(/\s+/).length <= 3) {
    if (!/\b(company|business|firm|agency|services|studio|practice)\b/i.test(text)) {
      return true
    }
  }

  return false
}

export function sanitizeSuggestedMetadata(
  raw: Partial<SuggestedSampleMetadata> | null | undefined,
  websiteUrl: string
): SuggestedSampleMetadata {
  let genericLabel = cleanText(raw?.genericLabel, 120)
  let businessCategory = cleanText(raw?.businessCategory, 80)
  let publicLocation = cleanText(raw?.publicLocation, 120)

  if (isUnsafeGenericLabel(genericLabel, websiteUrl)) {
    genericLabel = null
  }

  if (publicLocation) {
    const locHits = detectIdentifiers(publicLocation, websiteUrl)
    if (locHits.length > 0) publicLocation = null
    else {
      for (const token of hostTokens(websiteUrl)) {
        if (publicLocation.toLowerCase().includes(token.toLowerCase())) {
          publicLocation = null
          break
        }
      }
    }
  }

  if (businessCategory) {
    const catHits = detectIdentifiers(businessCategory, websiteUrl)
    if (catHits.length > 0) businessCategory = null
  }

  return { genericLabel, businessCategory, publicLocation }
}

/** Fill only currently-empty fields. Never overwrite non-empty Admin values. */
export function mergeSuggestedMetadata(
  current: CurrentSampleMetadata,
  suggestion: SuggestedSampleMetadata
): CurrentSampleMetadata {
  return {
    genericLabel: current.genericLabel.trim()
      ? current.genericLabel
      : suggestion.genericLabel || current.genericLabel,
    businessCategory: current.businessCategory.trim()
      ? current.businessCategory
      : suggestion.businessCategory || current.businessCategory,
    publicLocation: current.publicLocation.trim()
      ? current.publicLocation
      : suggestion.publicLocation || current.publicLocation,
    slug: current.slug,
  }
}

export function needsMetadataSuggestion(current: CurrentSampleMetadata): boolean {
  return (
    !current.genericLabel.trim() ||
    !current.businessCategory.trim() ||
    !current.publicLocation.trim()
  )
}

export function missingMetadataMessages(current: CurrentSampleMetadata): string[] {
  const messages: string[] = []
  if (!current.genericLabel.trim()) {
    messages.push(
      'Generic company label could not be determined. Enter a descriptive label such as B2B Digital Services Company.'
    )
  }
  if (!current.businessCategory.trim()) {
    messages.push('Business category could not be determined. Please enter a broad category.')
  }
  if (!current.publicLocation.trim()) {
    messages.push(
      'Public location could not be determined. Enter a broad location such as Pune, India.'
    )
  }
  return messages
}
