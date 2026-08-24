import type { SnapshotSections, DetailedSections } from '@/types/report'

function parseAllSections(
  text: string,
  keys: string[]
): Record<string, string> {
  const result: Record<string, string> = {}

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const nextKey = keys[i + 1]

    const keyWithColon = key + ':'
    const keyIndex = text.indexOf(keyWithColon)

    if (keyIndex === -1) {
      console.warn('[Parser] Key not found:', key)
      result[key] = ''
      continue
    }

    const contentStart = keyIndex + keyWithColon.length

    const nextKeyIndex = nextKey
      ? text.indexOf(nextKey + ':', contentStart)
      : -1

    const contentEnd =
      nextKeyIndex > contentStart
        ? nextKeyIndex
        : text.length

    const content = text
      .substring(contentStart, contentEnd)
      .trim()
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    result[key] = content
  }

  return result
}

export function parseSnapshotReport(
  aiText: string
): SnapshotSections | null {
  try {
    console.log(
      '[Parser] Snapshot input preview:',
      aiText.substring(0, 300)
    )

    const keys = [
      'INTRODUCTION',
      'WHY_SEO_MATTERS',
      'FIRST_IMPRESSION',
      'CONTENT_VISIBILITY',
      'COMPETITOR_PRESENCE',
      'KEYWORD_OPPORTUNITIES',
      'TECHNICAL_OBSERVATIONS',
      'WHAT_CAN_BE_IMPROVED',
      'NEXT_STEPS',
      'CONCLUSION',
    ]

    const raw = parseAllSections(aiText, keys)

    const sections: SnapshotSections = {
      introduction: raw['INTRODUCTION'] || '',
      whySeoMatters: raw['WHY_SEO_MATTERS'] || '',
      firstImpression: raw['FIRST_IMPRESSION'] || '',
      contentVisibility: raw['CONTENT_VISIBILITY'] || '',
      competitorPresence: raw['COMPETITOR_PRESENCE'] || '',
      keywordOpportunities: raw['KEYWORD_OPPORTUNITIES'] || '',
      technicalObservations: raw['TECHNICAL_OBSERVATIONS'] || '',
      whatCanBeImproved: raw['WHAT_CAN_BE_IMPROVED'] || '',
      nextSteps: raw['NEXT_STEPS'] || '',
      conclusion: raw['CONCLUSION'] || '',
    }

    const hasContent = Object.values(sections)
      .some(v => v.length > 30)

    if (!hasContent) {
      console.error('[Parser] Failed — no valid sections extracted. Preview:', aiText?.substring(0, 300))
      return null
    }

    console.log(
      '[Parser] Snapshot keys extracted:',
      Object.entries(sections)
        .map(([k, v]) => `${k}:${v.length}`)
        .join(', ')
    )

    return sections
  } catch (err) {
    console.error('[Parser] Snapshot error:', err)
    return null
  }
}

export function parseDetailedReport(
  aiText: string
): DetailedSections | null {
  try {
    console.log(
      '[Parser] Detailed input preview:',
      aiText.substring(0, 300)
    )

    const keys = [
      'INTRODUCTION',
      'WHY_SEO_MATTERS',
      'WEBSITE_POSITIONING',
      'CONTENT_STRATEGY',
      'COMPETITOR_LANDSCAPE',
      'KEYWORD_DIRECTION',
      'TECHNICAL_SIGNALS',
      'AUTHORITY_TRUST',
      'SEO_ROADMAP',
      'DETAILED_RECOMMENDATIONS',
      'NEXT_STEPS',
      'CONCLUSION',
    ]

    const raw = parseAllSections(aiText, keys)

    const sections: DetailedSections = {
      introduction: raw['INTRODUCTION'] || '',
      whySeoMatters: raw['WHY_SEO_MATTERS'] || '',
      websitePositioning: raw['WEBSITE_POSITIONING'] || '',
      contentStrategy: raw['CONTENT_STRATEGY'] || '',
      competitorLandscape: raw['COMPETITOR_LANDSCAPE'] || '',
      keywordDirection: raw['KEYWORD_DIRECTION'] || '',
      technicalSignals: raw['TECHNICAL_SIGNALS'] || '',
      authorityTrust: raw['AUTHORITY_TRUST'] || '',
      seoRoadmap: raw['SEO_ROADMAP'] || '',
      detailedRecommendations: raw['DETAILED_RECOMMENDATIONS'] || '',
      nextSteps: raw['NEXT_STEPS'] || '',
      conclusion: raw['CONCLUSION'] || '',
    }

    const hasContent = Object.values(sections)
      .some(v => v.length > 30)

    if (!hasContent) {
      console.error('[Parser] Failed — no valid sections extracted. Preview:', aiText?.substring(0, 300))
      return null
    }

    console.log(
      '[Parser] Detailed keys extracted:',
      Object.entries(sections)
        .map(([k, v]) => `${k}:${v.length}`)
        .join(', ')
    )

    return sections
  } catch (err) {
    console.error('[Parser] Detailed error:', err)
    return null
  }
}
