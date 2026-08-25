/**
 * Canonical comparison for anonymised section maps.
 * Used to no-op save_sections when a published sample is re-saved unchanged.
 */

export function toSectionStringMap(
  input: unknown
): Record<string, string> | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    out[key] = typeof value === 'string' ? value : value == null ? '' : String(value)
  }
  return out
}

export function anonymizedSectionsEqual(
  a: unknown,
  b: unknown
): boolean {
  const left = toSectionStringMap(a)
  const right = toSectionStringMap(b)
  if (!left || !right) return false

  const keysLeft = Object.keys(left).sort()
  const keysRight = Object.keys(right).sort()
  if (keysLeft.length !== keysRight.length) return false

  for (let i = 0; i < keysLeft.length; i++) {
    if (keysLeft[i] !== keysRight[i]) return false
    const key = keysLeft[i]
    if (left[key] !== right[key]) return false
  }
  return true
}

/**
 * Defense-in-depth: identical content on an already-published sample
 * must not call saveAnonymizedDraft (which clears use_as_sample).
 */
export function shouldNoOpPublishedSectionSave(input: {
  anonymizationStatus: string | null | undefined
  useAsSample: boolean | null | undefined
  storedSections: unknown
  incomingSections: unknown
  residualCount?: number
}): boolean {
  if (input.anonymizationStatus !== 'published') return false
  if (!input.useAsSample) return false
  if ((input.residualCount ?? 0) > 0) return false
  return anonymizedSectionsEqual(input.storedSections, input.incomingSections)
}
