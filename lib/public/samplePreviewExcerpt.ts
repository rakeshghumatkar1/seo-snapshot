import { sectionOrderKeys } from '@/lib/report/presentation'
import { detectReportVersion } from '@/types/report'

const DEFAULT_MAX_CHARS = 200
const MIN_CHARS = 48

const DISCLOSURE_RE =
  /identifying business details have been anonymis[ez]d/i

function toSectionMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (key === 'reportVersion') continue
    if (typeof value === 'string' && value.trim()) out[key] = value
  }
  return out
}

function cleanPreviewText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[#>*_`]+/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncateAtWord(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  const slice = text.slice(0, maxChars)
  const lastSpace = slice.lastIndexOf(' ')
  const trimmed = (lastSpace > maxChars * 0.6 ? slice.slice(0, lastSpace) : slice).trim()
  return trimmed.replace(/[.,;:]+$/, '') + '…'
}

/**
 * Derive a short homepage-card excerpt from public-safe sample sections.
 * Does not include full report bodies.
 */
export function deriveSamplePreviewText(
  sectionsRaw: unknown,
  options?: {
    reportType?: 'snapshot' | 'detailed'
    maxChars?: number
  }
): string | null {
  const sections = toSectionMap(sectionsRaw)
  const keys = Object.keys(sections)
  if (!keys.length) return null

  const reportType = options?.reportType === 'detailed' ? 'detailed' : 'snapshot'
  const version = detectReportVersion(sections)
  const ordered = sectionOrderKeys(reportType, version)
  const preferred = ordered.length
    ? [...ordered.filter((k) => sections[k]), ...keys.filter((k) => !ordered.includes(k))]
    : keys

  const maxChars = options?.maxChars ?? DEFAULT_MAX_CHARS

  for (const key of preferred) {
    const cleaned = cleanPreviewText(sections[key] || '')
    if (!cleaned || cleaned.length < MIN_CHARS) continue
    if (DISCLOSURE_RE.test(cleaned)) continue
    return truncateAtWord(cleaned, maxChars)
  }

  return null
}
