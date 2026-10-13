import { SNAPSHOT_SECTION_MARKERS_V3 } from '../parseReportV3'

export function isValidSnapshotV3Prompt(content: string): boolean {
  const text = content || ''
  return SNAPSHOT_SECTION_MARKERS_V3.every(marker => text.includes(marker))
}

export function isValidDetailedV3Prompt(content: string): boolean {
  const text = content || ''
  return [
    'EXECUTIVE_BUSINESS_ASSESSMENT:',
    'SEARCH_AS_GROWTH_CHANNEL:',
    'AI_DISCOVERY_READINESS:',
    'PRIORITY_INVESTMENT_PLAN:',
    'ACTION_ROADMAP:',
    'MANDATORY SECTION COMPLETENESS',
  ].every(marker => text.includes(marker))
}
