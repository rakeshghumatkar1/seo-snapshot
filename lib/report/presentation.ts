import {
  DETAILED_V3_SECTION_LABELS,
  SNAPSHOT_V3_SECTION_LABELS,
  type SectionLabel,
} from '@/lib/report/sectionLabels'
import {
  CANONICAL_ORIGIN,
  SEO_SUPPORT_EMAIL,
  SEO_SUPPORT_PHONE_DISPLAY,
  SEO_SUPPORT_PHONE_LINK,
  THINK_BIG_CONTACT_FORM,
  THINK_BIG_HOME,
} from '@/lib/brand/links'

export const BRAND_NAME = 'Think Big Digital'

export function reportDocumentTitle(reportType: 'snapshot' | 'detailed'): string {
  return reportType === 'detailed'
    ? 'Search & Business Growth Detailed Report'
    : 'Search & Business Growth Snapshot'
}

export function formatReportDate(date = new Date()): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function displayDomain(websiteUrl: string): string {
  return websiteUrl
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '')
}

export const REPORT_TAGLINE = 'Search • AI Discovery • Trust • Enquiry'

export const REPORT_CONTACT = {
  brand: BRAND_NAME,
  homeUrl: THINK_BIG_HOME,
  contactUrl: THINK_BIG_CONTACT_FORM,
  seoToolUrl: CANONICAL_ORIGIN,
  emailDisplay: 'grow@thinkbigdigital.in',
  emailHref: SEO_SUPPORT_EMAIL,
  phoneDisplay: SEO_SUPPORT_PHONE_DISPLAY,
  phoneHref: SEO_SUPPORT_PHONE_LINK,
} as const

/** Sections that receive slightly stronger visual weight (V3 only). */
export const SNAPSHOT_EMPHASIS_KEYS = new Set([
  'searchOpportunity',
  'trustReputation',
  'traditionalSearchReadiness',
  'aiDiscoveryReadiness',
  'topPriorityActions',
  'limitsNextStep',
])

export const DETAILED_EMPHASIS_KEYS = new Set([
  'executiveBusinessAssessment',
  'priorityInvestmentPlan',
  'actionRoadmap',
  'evidenceLimitations',
])

export function isEmphasizedSection(
  key: string,
  reportType: 'snapshot' | 'detailed',
  version: 2 | 3
): boolean {
  if (version !== 3) return false
  return reportType === 'detailed'
    ? DETAILED_EMPHASIS_KEYS.has(key)
    : SNAPSHOT_EMPHASIS_KEYS.has(key)
}

export function formatSectionNumber(index: number): string {
  return String(index + 1).padStart(2, '0')
}

export function sectionOrderKeys(
  reportType: 'snapshot' | 'detailed',
  version: 2 | 3
): string[] {
  if (version === 3) {
    return reportType === 'detailed'
      ? Object.keys(DETAILED_V3_SECTION_LABELS)
      : Object.keys(SNAPSHOT_V3_SECTION_LABELS)
  }
  return []
}

export type ContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'stage'; label: string; text: string }
  | { type: 'priority'; index: number; text: string }

/** Presentation-only split. Does not rewrite wording. */
export function splitReportContent(content: string): ContentBlock[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: ContentBlock[] = []
  let paragraph: string[] = []

  const flushParagraph = () => {
    const text = paragraph.join('\n').trim()
    if (text) blocks.push({ type: 'paragraph', text })
    paragraph = []
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const trimmed = line.trim()

    const stage = trimmed.match(/^(FOUNDATION|GROWTH|MONITOR\s*&\s*IMPROVE)\s*[:：-]?\s*(.*)$/i)
    if (stage) {
      flushParagraph()
      const label = stage[1].toUpperCase().replace(/\s+/g, ' ')
      const rest = stage[2]?.trim() || ''
      blocks.push({ type: 'stage', label, text: rest })
      continue
    }

    const priority = trimmed.match(/^(\d+)[.)]\s+(.+)$/)
    if (priority) {
      flushParagraph()
      blocks.push({
        type: 'priority',
        index: Number(priority[1]),
        text: priority[2].trim(),
      })
      continue
    }

    if (!trimmed) {
      flushParagraph()
      continue
    }

    paragraph.push(line)
  }

  flushParagraph()
  return blocks.length ? blocks : [{ type: 'paragraph', text: content.trim() }]
}

export function labelWithNumber(
  label: SectionLabel,
  index: number
): { number: string; category: string; title: string } {
  return {
    number: formatSectionNumber(index),
    category: label.category,
    title: label.title,
  }
}
