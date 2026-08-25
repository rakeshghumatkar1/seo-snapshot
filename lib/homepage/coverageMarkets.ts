export type HomepageCoverageMarket = {
  businessCategory: string | null
  publicLocation: string | null
}

export type CoverageSourceRow = {
  business_category?: string | null
  public_location?: string | null
}

function normalizePart(value: unknown): string | null {
  const trimmed = String(value ?? '').trim()
  return trimmed || null
}

function coverageKey(category: string | null, location: string | null): string {
  return `${(category || '').toLowerCase()}||${(location || '').toLowerCase()}`
}

/**
 * Build unique industry/market coverage entries from published anonymised showcase rows.
 * Preserves input order (caller should order: featured, display_order, updated_at).
 */
export function buildCoverageMarkets(
  rows: CoverageSourceRow[],
  limit = 6
): HomepageCoverageMarket[] {
  const seen = new Set<string>()
  const out: HomepageCoverageMarket[] = []

  for (const row of rows || []) {
    const businessCategory = normalizePart(row.business_category)
    const publicLocation = normalizePart(row.public_location)
    if (!businessCategory && !publicLocation) continue

    const key = coverageKey(businessCategory, publicLocation)
    if (seen.has(key)) continue
    seen.add(key)

    out.push({ businessCategory, publicLocation })
    if (out.length >= limit) break
  }

  return out
}
