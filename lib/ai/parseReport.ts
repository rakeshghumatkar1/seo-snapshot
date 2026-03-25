import type { SnapshotSections, DetailedSections } from '@/types/report'

const ALL_KEYS = [
  'INTRODUCTION',
  'WHY_SEO_MATTERS',
  'CURRENT_VISIBILITY',
  'CONTENT_AUTHORITY',
  'TECHNICAL_STRUCTURE',
  'OPPORTUNITIES',
  'NEXT_STEPS',
  'CURRENT_POSITIONING',
  'TECHNICAL_REVIEW',
  'COMPETITOR_PRESENCE',
  'KEYWORD_DIRECTION',
  'CONTENT_STRATEGY',
  'ROADMAP',
  'CONCLUSION',
]

function parseAllSections(text: string): Record<string, string> {
  const result: Record<string, string> = {}

  for (let i = 0; i < ALL_KEYS.length; i++) {
    const key = ALL_KEYS[i]
    const nextKey = ALL_KEYS[i + 1]

    // Find where this key starts
    const keyIndex = text.indexOf(key + ':')
    if (keyIndex === -1) continue

    // Content starts after "KEY:"
    const contentStart = keyIndex + key.length + 1

    // Find where next key starts (scan all remaining keys, pick closest)
    let nextKeyIndex = text.length
    for (let j = i + 1; j < ALL_KEYS.length; j++) {
      const idx = text.indexOf(ALL_KEYS[j] + ':', contentStart)
      if (idx !== -1 && idx < nextKeyIndex) {
        nextKeyIndex = idx
        break
      }
    }

    const content = text
      .substring(contentStart, nextKeyIndex)
      .trim()
      .replace(/^#+\s*/gm, '')
      .replace(/\*\*/g, '')
      .replace(/\n+/g, ' ')
      .trim()

    if (content.length > 10) {
      result[key] = content
    }
  }

  return result
}

function toCamelCase(key: string): string {
  return key
    .toLowerCase()
    .replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

export function parseSnapshotReport(aiText: string): SnapshotSections | null {
  try {
    console.log('[Parser] Input preview:', aiText.substring(0, 500))

    const raw = parseAllSections(aiText)

    console.log('[Parser] Extracted keys:',
      Object.entries(raw).map(([k, v]) => `${k}:${v.length}`).join(', ')
    )

    const snapshotKeys = [
      'INTRODUCTION', 'WHY_SEO_MATTERS', 'CURRENT_VISIBILITY',
      'CONTENT_AUTHORITY', 'TECHNICAL_STRUCTURE', 'OPPORTUNITIES', 'NEXT_STEPS',
    ]

    // Check if ANY section has real content
    const hasContent = snapshotKeys.some(k => (raw[k]?.length || 0) > 30)

    if (!hasContent) {
      console.error('[Parser] Zero extraction — full text:', aiText.substring(0, 1000))
      return null
    }

    const fallbacks = getSnapshotFallbacks()
    const sections: SnapshotSections = {
      introduction: raw['INTRODUCTION'] || fallbacks.introduction,
      whySeoMatters: raw['WHY_SEO_MATTERS'] || fallbacks.whySeoMatters,
      currentVisibility: raw['CURRENT_VISIBILITY'] || fallbacks.currentVisibility,
      contentAuthority: raw['CONTENT_AUTHORITY'] || fallbacks.contentAuthority,
      technicalStructure: raw['TECHNICAL_STRUCTURE'] || fallbacks.technicalStructure,
      opportunities: raw['OPPORTUNITIES'] || fallbacks.opportunities,
      nextSteps: raw['NEXT_STEPS'] || fallbacks.nextSteps,
    }

    return sections
  } catch (err) {
    console.error('[Parser] Error:', err)
    return null
  }
}

export function parseDetailedReport(aiText: string): DetailedSections | null {
  try {
    const snapshot = parseSnapshotReport(aiText)
    if (!snapshot) return null

    const raw = parseAllSections(aiText)
    const fallbacks = getDetailedFallbacks()

    const detailed: DetailedSections = {
      ...snapshot,
      currentPositioning: raw['CURRENT_POSITIONING'] || fallbacks.currentPositioning,
      technicalReview: raw['TECHNICAL_REVIEW'] || fallbacks.technicalReview,
      competitorPresence: raw['COMPETITOR_PRESENCE'] || fallbacks.competitorPresence,
      keywordDirection: raw['KEYWORD_DIRECTION'] || fallbacks.keywordDirection,
      contentStrategy: raw['CONTENT_STRATEGY'] || fallbacks.contentStrategy,
      roadmap: raw['ROADMAP'] || fallbacks.roadmap,
      conclusion: raw['CONCLUSION'] || fallbacks.conclusion,
    }

    return detailed
  } catch (err) {
    console.error('[Parser] Detailed error:', err)
    return null
  }
}

function getSnapshotFallbacks(): SnapshotSections {
  return {
    introduction: 'Your website shows real potential for organic growth. This report outlines the key areas where focused effort will drive the strongest results.',
    whySeoMatters: 'Organic search is the highest-ROI channel for most businesses. Investing in SEO now builds a compounding asset that pays dividends for years.',
    currentVisibility: 'Your current organic presence has room to grow. The good news is that the fundamentals are in place to build from.',
    contentAuthority: 'Building topical authority through consistent, focused content is your clearest path to stronger search visibility.',
    technicalStructure: 'Your technical foundation is workable. Some structural improvements will help search engines better understand your content.',
    opportunities: 'Content depth, internal linking, and clearer page purpose are your highest-leverage opportunities right now.',
    nextSteps: 'Start by auditing your core service pages for clarity and depth. Then build a content calendar around your primary topics.',
  }
}

function getDetailedFallbacks(): Omit<DetailedSections, keyof SnapshotSections> {
  return {
    currentPositioning: 'Your positioning in organic search reflects an early-stage presence with significant upside available.',
    technicalReview: 'The site structure supports basic indexing. Improvements in page speed and internal architecture will compound results.',
    competitorPresence: 'Competitors in your space are investing in content and authority-building. There is meaningful space to differentiate.',
    keywordDirection: 'Focus on intent-matched keywords that reflect your buyers decision journey rather than high-volume generic terms.',
    contentStrategy: 'A pillar-and-cluster content model built around your core service topics will build authority most efficiently.',
    roadmap: 'Month one: core page optimization. Month two: supporting content creation. Month three: link building and authority signals.',
    conclusion: 'The opportunity ahead is significant. With focused execution on the priorities outlined here, meaningful organic growth is achievable within 90 days.',
  }
}
