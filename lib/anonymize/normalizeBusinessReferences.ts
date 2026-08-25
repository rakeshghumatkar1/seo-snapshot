/**
 * Presentation cleanup for anonymised sample section prose.
 * Replaces the full configured public display label with natural business references.
 * Does NOT replace partial words like "Digital", "Services", or "Company".
 */

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function tidyGrammar(text: string): string {
  return text
    .replace(/\b([Tt]he)\s+[Tt]he\s+business\b/g, '$1 business')
    .replace(/\bthe\s+The\s+business\b/g, 'the business')
    .replace(/\bThe\s+the\s+business\b/g, 'The business')
    .replace(/\bthe business(?:'s){2,}\b/gi, "the business's")
    .replace(/\bThe business(?:'s){2,}\b/g, "The business's")
    .replace(/\bthe business Company\b/gi, 'the business')
    .replace(/\bThe business Company\b/g, 'The business')
    .replace(/\s{2,}/g, ' ')
}

/**
 * Normalize one section string.
 */
export function normalizeAnonymizedBusinessReferenceText(
  text: string,
  publicDisplayName: string
): string {
  const label = String(publicDisplayName || '').trim()
  const source = String(text || '')
  if (!label || label.length < 3 || !source) return source

  const escaped = escapeRegExp(label)
  let out = source

  // Possessive with leading article
  out = out.replace(new RegExp(`\\bThe\\s+${escaped}'s\\b`, 'g'), "The business's")
  out = out.replace(new RegExp(`\\bthe\\s+${escaped}'s\\b`, 'gi'), "the business's")
  out = out.replace(new RegExp(`\\b${escaped}'s\\b`, 'gi'), "the business's")

  // Full label with leading article
  out = out.replace(new RegExp(`\\bThe\\s+${escaped}\\b`, 'g'), 'The business')
  out = out.replace(new RegExp(`\\bthe\\s+${escaped}\\b`, 'gi'), 'the business')

  // Bare full label
  out = out.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), 'the business')

  return tidyGrammar(out)
}

export function normalizeAnonymizedBusinessReferences(
  sections: Record<string, string>,
  publicDisplayName: string
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(sections || {})) {
    out[key] =
      typeof value === 'string'
        ? normalizeAnonymizedBusinessReferenceText(value, publicDisplayName)
        : String(value ?? '')
  }
  return out
}

/** Count exact full-label matches in section body text (case-insensitive). */
export function countGenericLabelOccurrences(
  sections: Record<string, string>,
  publicDisplayName: string
): number {
  const label = String(publicDisplayName || '').trim()
  if (!label) return 0
  const re = new RegExp(`\\b${escapeRegExp(label)}\\b`, 'gi')
  let count = 0
  for (const value of Object.values(sections || {})) {
    if (typeof value !== 'string') continue
    const matches = value.match(re)
    if (matches) count += matches.length
  }
  return count
}

/** Homepage sample selection: anonymised wins when any published anonymised samples exist. */
export function preferAnonymizedHomepageSamples<T>(anonymized: T[], source: T[]): T[] {
  return anonymized.length > 0 ? anonymized : source
}
