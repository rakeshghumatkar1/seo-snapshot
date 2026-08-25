import {
  DETAILED_V3_SECTION_LABELS,
  SNAPSHOT_V3_SECTION_LABELS,
} from '@/lib/report/sectionLabels'
import { detectReportVersion } from '@/types/report'
import type { StructureValidationResult } from './types'

export function extractSourceSections(
  sectionsJson: Record<string, unknown> | null | undefined
): Record<string, string> {
  const out: Record<string, string> = {}
  if (!sectionsJson || typeof sectionsJson !== 'object') return out
  for (const [key, value] of Object.entries(sectionsJson)) {
    if (key === 'reportVersion') continue
    if (typeof value === 'string') out[key] = value
  }
  return out
}

export function expectedSectionKeys(
  sourceSections: Record<string, string>,
  reportType: 'snapshot' | 'detailed',
  version: 2 | 3
): string[] {
  if (version === 3) {
    return reportType === 'detailed'
      ? Object.keys(DETAILED_V3_SECTION_LABELS)
      : Object.keys(SNAPSHOT_V3_SECTION_LABELS)
  }
  return Object.keys(sourceSections)
}

export function validateAnonymizedStructure(
  candidate: unknown,
  expectedKeys: string[],
  sourceSections: Record<string, string>
): StructureValidationResult {
  const errors: string[] = []

  if (!candidate || typeof candidate !== 'object') {
    return { valid: false, errors: ['Response is not an object'] }
  }

  const root = candidate as Record<string, unknown>
  const sectionsRaw = root.sections
  if (!sectionsRaw || typeof sectionsRaw !== 'object' || Array.isArray(sectionsRaw)) {
    return { valid: false, errors: ['Missing sections object'] }
  }

  const sections = sectionsRaw as Record<string, unknown>
  const keys = Object.keys(sections)

  if (keys.length !== expectedKeys.length) {
    errors.push(
      `Section count mismatch: expected ${expectedKeys.length}, got ${keys.length}`
    )
  }

  for (const key of expectedKeys) {
    if (!(key in sections)) {
      errors.push(`Missing section key: ${key}`)
      continue
    }
    const value = sections[key]
    if (typeof value !== 'string') {
      errors.push(`Section ${key} is not a string`)
      continue
    }
    const source = sourceSections[key] || ''
    if (source.trim() && !value.trim()) {
      errors.push(`Section ${key} is blank but source was not blank`)
    }
  }

  for (const key of keys) {
    if (!expectedKeys.includes(key)) {
      errors.push(`Unexpected section key: ${key}`)
    }
  }

  if (errors.length) return { valid: false, errors }

  const clean: Record<string, string> = {}
  for (const key of expectedKeys) {
    clean[key] = String(sections[key] || '')
  }
  return { valid: true, errors: [], sections: clean }
}

export function parseJsonObject(text: string): unknown | null {
  const raw = String(text || '').trim()
  if (!raw) return null

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = (fenced?.[1] || raw).trim()

  try {
    return JSON.parse(candidate)
  } catch {
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1))
      } catch {
        return null
      }
    }
    return null
  }
}

export function resolveExpectedKeysFromReport(
  sectionsJson: Record<string, unknown>,
  reportType: 'snapshot' | 'detailed'
): { version: 2 | 3; sourceSections: Record<string, string>; keys: string[] } {
  const version = detectReportVersion(sectionsJson)
  const sourceSections = extractSourceSections(sectionsJson)
  const keys = expectedSectionKeys(sourceSections, reportType, version)
  return { version, sourceSections, keys }
}
