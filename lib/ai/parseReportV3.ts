import type { DetailedSections, SnapshotSections } from '@/types/report'
import {
  DETAILED_V3_FIELD_MAP,
  DETAILED_V3_KEYS,
  SNAPSHOT_V3_FIELD_MAP,
  SNAPSHOT_V3_KEYS,
} from '@/types/reportV3'

function parseAllSections(text: string, keys: readonly string[]): Record<string, string> {
  const result: Record<string, string> = {}

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const nextKey = keys[i + 1]
    const keyWithColon = key + ':'
    const keyIndex = text.indexOf(keyWithColon)

    if (keyIndex === -1) {
      console.warn('[ParserV3] Key not found:', key)
      result[key] = ''
      continue
    }

    const contentStart = keyIndex + keyWithColon.length
    const nextKeyIndex = nextKey ? text.indexOf(nextKey + ':', contentStart) : -1
    const contentEnd = nextKeyIndex > contentStart ? nextKeyIndex : text.length

    result[key] = text
      .substring(contentStart, contentEnd)
      .trim()
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  return result
}

function assertRequiredContent(
  sections: Record<string, string>,
  minFilled: number,
  minChars: number
): boolean {
  const filled = Object.values(sections).filter(v => v.length >= minChars)
  if (filled.length < minFilled) {
    console.error(
      `[ParserV3] Insufficient sections: ${filled.length}/${minFilled} with >= ${minChars} chars`
    )
    return false
  }
  return true
}

export function parseSnapshotReportV3(aiText: string): SnapshotSections | null {
  try {
    console.log('[ParserV3] Snapshot preview:', aiText.substring(0, 300))
    const raw = parseAllSections(aiText, SNAPSHOT_V3_KEYS)

    const sections = {} as SnapshotSections
    for (const key of SNAPSHOT_V3_KEYS) {
      sections[SNAPSHOT_V3_FIELD_MAP[key]] = raw[key] || ''
    }

    const missing = SNAPSHOT_V3_KEYS.filter(k => !(raw[k] && raw[k].length > 0))
    if (missing.length > 0) {
      console.error('[ParserV3] Snapshot missing markers:', missing.join(', '))
      return null
    }

    if (!assertRequiredContent(sections as unknown as Record<string, string>, 8, 40)) {
      return null
    }

    console.log(
      '[ParserV3] Snapshot ok:',
      Object.entries(sections)
        .map(([k, v]) => `${k}:${v.length}`)
        .join(', ')
    )
    return sections
  } catch (err) {
    console.error('[ParserV3] Snapshot error:', err)
    return null
  }
}

export function parseDetailedReportV3(aiText: string): DetailedSections | null {
  try {
    console.log('[ParserV3] Detailed preview:', aiText.substring(0, 300))
    const raw = parseAllSections(aiText, DETAILED_V3_KEYS)

    const sections = {} as DetailedSections
    for (const key of DETAILED_V3_KEYS) {
      sections[DETAILED_V3_FIELD_MAP[key]] = raw[key] || ''
    }

    const missing = DETAILED_V3_KEYS.filter(k => !(raw[k] && raw[k].length > 0))
    if (missing.length > 0) {
      console.error('[ParserV3] Detailed missing markers:', missing.join(', '))
      return null
    }

    if (!assertRequiredContent(sections as unknown as Record<string, string>, 12, 40)) {
      return null
    }

    console.log(
      '[ParserV3] Detailed ok:',
      Object.entries(sections)
        .map(([k, v]) => `${k}:${v.length}`)
        .join(', ')
    )
    return sections
  } catch (err) {
    console.error('[ParserV3] Detailed error:', err)
    return null
  }
}
